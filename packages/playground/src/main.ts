import * as monaco from "monaco-editor/esm/vs/editor/editor.api"
import "monaco-editor/esm/vs/basic-languages/python/python.contribution"
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker"
import { analyze, debounce, narapyUrl } from "./analyze"
import { LANGUAGE_ID, monarchDefinition } from "./language"
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
const editor = monaco.editor.create(element("editor"), { ...editorOptions, value: loadSource(), language: LANGUAGE_ID })
const pythonView = monaco.editor.create(element("python"), {
  ...editorOptions,
  value: "",
  language: "python",
  readOnly: true,
  domReadOnly: true,
})

const status = element("status")
const openButton = element<HTMLButtonElement>("open-narapy")
const runButton = element<HTMLButtonElement>("run")
const stopButton = element<HTMLButtonElement>("stop")
const stdinBox = element<HTMLTextAreaElement>("stdin")
const output = element("output")
let currentUrl: string | null = null
let currentAnalysis = analyze("")

function appendOutput(text: string, className?: string): void {
  const line = document.createElement("div")
  line.textContent = text
  if (className !== undefined) line.className = className
  output.append(line)
  output.scrollTop = output.scrollHeight
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
    runButton.disabled = currentAnalysis.errorCount > 0 || currentAnalysis.python === ""
    stopButton.hidden = true
  },
})

runButton.addEventListener("click", () => {
  output.replaceChildren()
  markRuntimeError(null)
  runButton.disabled = true
  stopButton.hidden = false
  runner.run(currentAnalysis.python, stdinBox.value)
})
stopButton.addEventListener("click", () => runner.stop())

function render(): void {
  const source = editor.getValue()
  const analysis = analyze(source)
  currentAnalysis = analysis
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
  // エラー中は直前の Python を残す（書きかけで右側がちらつかないように）
  if (analysis.errorCount === 0) pythonView.setValue(analysis.python)

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
