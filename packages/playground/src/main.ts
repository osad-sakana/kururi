import * as monaco from "monaco-editor/esm/vs/editor/editor.api"
import "monaco-editor/esm/vs/basic-languages/python/python.contribution"
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker"
import { analyze, debounce, narapyUrl } from "./analyze"
import { iconCss } from "./icon-css"
import { LANGUAGE_ID, monarchDefinition } from "./language"
import { classifyLines } from "./line-icons"
import { mapRuntimeError } from "./runtime"
import { createRunner } from "./runner"
import { SAMPLE } from "./sample"
import "./style.css"

self.MonacoEnvironment = { getWorker: () => new editorWorker() }

const MARKER_OWNER = "kururi"
const STORAGE_KEY = "kururi.source"

function element<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id)
  if (found === null) throw new Error(`#${id} がありません`)
  return found as T
}

function loadSource(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? SAMPLE
  } catch {
    return SAMPLE
  }
}

function saveSource(source: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, source)
  } catch {
    // 保存できなくても編集は続けられる
  }
}

monaco.languages.register({ id: LANGUAGE_ID })
monaco.languages.setMonarchTokensProvider(LANGUAGE_ID, monarchDefinition() as monaco.languages.IMonarchLanguage)
monaco.languages.setLanguageConfiguration(LANGUAGE_ID, {
  comments: { lineComment: "//" },
  brackets: [["{", "}"], ["[", "]"], ["(", ")"]],
  autoClosingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: '"', close: '"', notIn: ["string"] },
    { open: "`", close: "`", notIn: ["string"] },
  ],
})

const editorOptions = { automaticLayout: true, minimap: { enabled: false }, fontSize: 14 } as const
const editor = monaco.editor.create(element("editor"), { ...editorOptions, lineDecorationsWidth: 24, value: loadSource(), language: LANGUAGE_ID })
const iconStyle = document.createElement("style")
iconStyle.textContent = iconCss()
document.head.append(iconStyle)
const iconDecorations = editor.createDecorationsCollection()

/** 行番号の右に、宣言と制御構文のアイコンを出す */
function renderLineIcons(source: string): void {
  iconDecorations.set(
    classifyLines(source).map(({ line, kind, hint }) => ({
      range: new monaco.Range(line, 1, line, 1),
      options: { linesDecorationsClassName: `kururi-icon kururi-icon-${kind}`, linesDecorationsTooltip: hint },
    })),
  )
}
const pythonView = monaco.editor.create(element("python"), {
  ...editorOptions,
  value: "",
  language: "python",
  readOnly: true,
  domReadOnly: true,
  readOnlyMessage: { value: "Python は Kururi から自動で作られます。左の Kururi を直してください" },
  renderLineHighlight: "none",
  wordWrap: "on",
})

const status = element("status")
const openButton = element<HTMLButtonElement>("open-narapy")
const runButton = element<HTMLButtonElement>("run")
const stopButton = element<HTMLButtonElement>("stop")
const output = element("output")
let currentUrl: string | null = null
let currentAnalysis = analyze("")
let pendingInput: { readonly row: HTMLElement; readonly cancel: () => void } | null = null

function appendOutput(text: string, className?: string): void {
  const line = document.createElement("div")
  line.textContent = text
  if (className !== undefined) line.className = className
  output.append(line)
  output.scrollTop = output.scrollHeight
}

/** input() の入力欄を、出力の流れの中（その行の続き）に出す。Enter で確定すると、入力した値が出力に残る。 */
function askInline(prompt: string): Promise<string | null> {
  return new Promise((resolve) => {
    const row = document.createElement("div")
    row.className = "prompt-line"
    const label = document.createElement("span")
    label.textContent = prompt
    const field = document.createElement("input")
    field.type = "text"
    field.setAttribute("aria-label", prompt === "" ? "入力" : prompt)
    row.append(label, field)
    output.append(row)
    field.focus()
    output.scrollTop = output.scrollHeight
    pendingInput = { row, cancel: () => resolve(null) }
    field.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" || event.isComposing) return
      pendingInput = null
      const value = field.value
      row.replaceChildren(`${prompt}${value}`)
      resolve(value)
    })
  })
}

function cancelInput(): void {
  pendingInput?.row.remove()
  pendingInput?.cancel()
  pendingInput = null
}

function markRuntimeError(line: number | null): void {
  const model = editor.getModel()
  if (model === null) return
  const markers =
    line === null
      ? []
      : [{ startLineNumber: line, startColumn: 1, endLineNumber: line, endColumn: model.getLineMaxColumn(line), message: "ここで実行時エラーが起きました", severity: monaco.MarkerSeverity.Warning, source: "実行" }]
  monaco.editor.setModelMarkers(model, "kururi-runtime", markers)
}

const runner = createRunner({
  onInput: askInline,
  onOutput: (text) => appendOutput(text),
  onStatus: (text) => {
    status.textContent = text
  },
  onError: (traceback) => {
    const error = mapRuntimeError(traceback, currentAnalysis.lineMap)
    markRuntimeError(error.kururiLine)
    const where = error.kururiLine === null ? "" : `（Kururi の ${error.kururiLine} 行目）`
    appendOutput(`実行時エラー${where}: ${error.summary}`, "error")
  },
  onFinish: () => {
    cancelInput()
    runButton.disabled = currentAnalysis.errorCount > 0 || currentAnalysis.python === ""
    stopButton.hidden = true
  },
})

runButton.addEventListener("click", () => {
  output.replaceChildren()
  markRuntimeError(null)
  runButton.disabled = true
  stopButton.hidden = false
  runner.run(currentAnalysis.python)
})
stopButton.addEventListener("click", () => runner.stop())

function render(): void {
  const source = editor.getValue()
  const analysis = analyze(source)
  currentAnalysis = analysis
  renderLineIcons(source)
  const model = editor.getModel()
  if (model !== null) {
    monaco.editor.setModelMarkers(
      model,
      MARKER_OWNER,
      analysis.markers.map((marker) => ({
        ...marker,
        severity: marker.severity === "error" ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning,
        source: marker.code,
      })),
    )
  }
  // Python にできない間は、Python 欄にエラーを出し続ける
  const pythonModel = pythonView.getModel()
  if (pythonModel !== null) monaco.editor.setModelLanguage(pythonModel, analysis.errorCount > 0 ? "plaintext" : "python")
  pythonView.setValue(analysis.errorCount > 0 ? analysis.errorText : analysis.python)

  try {
    currentUrl = narapyUrl(source, analysis)
    status.textContent = analysis.errorCount > 0 ? `エラー ${analysis.errorCount} 件` : ""
  } catch (error) {
    currentUrl = null
    status.textContent = error instanceof Error ? error.message : String(error)
  }
  status.classList.toggle("error", analysis.errorCount > 0)
  openButton.disabled = currentUrl === null
  if (stopButton.hidden) runButton.disabled = analysis.errorCount > 0 || analysis.python === ""
  saveSource(source)
}

editor.onDidChangeModelContent(debounce(render, 200))
openButton.addEventListener("click", () => {
  if (currentUrl !== null) window.open(currentUrl, "_blank", "noopener")
})
render()
