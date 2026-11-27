import * as monaco from "monaco-editor/esm/vs/editor/editor.api"
import "monaco-editor/esm/vs/basic-languages/python/python.contribution"
// editor.api は中身だけなので、使う機能（補完・ホバー・電球・検索 など）を足す
import "monaco-editor/esm/vs/editor/contrib/suggest/browser/suggestController"
import "monaco-editor/esm/vs/editor/contrib/snippet/browser/snippetController2"
import "monaco-editor/esm/vs/editor/contrib/hover/browser/hoverContribution"
import "monaco-editor/esm/vs/editor/contrib/codeAction/browser/codeActionContributions"
import "monaco-editor/esm/vs/editor/contrib/comment/browser/comment"
import "monaco-editor/esm/vs/editor/contrib/find/browser/findController"
import "monaco-editor/esm/vs/editor/contrib/bracketMatching/browser/bracketMatching"
import "monaco-editor/esm/vs/editor/contrib/linesOperations/browser/linesOperations"
import "monaco-editor/esm/vs/editor/contrib/wordHighlighter/browser/wordHighlighter"
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker"
import { applyBrand } from "./brand"
import { analyze, debounce, narapyUrl, type EditorMarker } from "./analyze"
import { applyFix } from "./quick-fix"
import { renderProblems } from "./problems"
import { iconCss } from "./icon-css"
import { kururiLineFor, pythonLinesFor } from "./line-link"
import { registerEditorHelp } from "./editor-help"
import { LANGUAGE_ID, monarchDefinition } from "./language"
import { classifyLines } from "./line-icons"
import { mapRuntimeError } from "./runtime"
import { createRunner } from "./runner"
import type { TraceResult } from "./trace-types"
import { createStepPanel } from "./step-panel"
import { SAMPLE } from "./sample"
import { sourceFromHash } from "./share"
import { SAMPLES } from "./samples"
import { FONT_SIZE, clampFontSize, loadFontSize, loadThemePreference, nextThemePreference, saveFontSize, saveThemePreference } from "./preferences"
import { applyTheme, defineThemes, onSystemThemeChange } from "./theme"
import "../styles/tokens.css"
import "./style.css"

applyBrand()

self.MonacoEnvironment = { getWorker: () => new editorWorker() }

const MARKER_OWNER = "kururi"
const STORAGE_KEY = "kururi.source"

function element<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id)
  if (found === null) throw new Error(`#${id} がありません`)
  return found as T
}

function loadSource(): string {
  // チュートリアルなどのリンク（#code=...）で開いたときは、そのコードを使う
  const shared = sourceFromHash(location.hash)
  if (shared !== null) return shared
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

defineThemes()
let themePreference = loadThemePreference()
applyTheme(themePreference)
onSystemThemeChange(() => applyTheme(themePreference))
let fontSize = loadFontSize()
// narapy のエディタと同じ設定（書体、折り返し、細いスクロールバー など）
registerEditorHelp(LANGUAGE_ID)
const editorOptions = {
  automaticLayout: true,
  minimap: { enabled: false },
  fontSize,
  fontFamily: '"0xProto", "Fira Code", "Cascadia Code", monospace',
  fontLigatures: true,
  scrollBeyondLastLine: false,
  tabSize: 4,
  insertSpaces: true,
  renderWhitespace: "boundary",
  bracketPairColorization: { enabled: true },
  overviewRulerLanes: 0,
  hideCursorInOverviewRuler: true,
  overviewRulerBorder: false,
  scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
} as const
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

const THEME_LABELS = { system: "見た目：自動", light: "見た目：ライト", dark: "見た目：ダーク" } as const
const themeButton = element<HTMLButtonElement>("theme")
const fontLabel = element("font-size")
const fontDown = element<HTMLButtonElement>("font-down")
const fontUp = element<HTMLButtonElement>("font-up")

function showPreferences(): void {
  themeButton.textContent = THEME_LABELS[themePreference]
  fontLabel.textContent = String(fontSize)
  fontDown.disabled = fontSize <= FONT_SIZE.min
  fontUp.disabled = fontSize >= FONT_SIZE.max
  document.documentElement.style.setProperty("--code-size", `${fontSize}px`)
  editor.updateOptions({ fontSize })
  pythonView.updateOptions({ fontSize })
}

function changeFontSize(next: number): void {
  fontSize = clampFontSize(next)
  saveFontSize(fontSize)
  showPreferences()
}

fontDown.addEventListener("click", () => changeFontSize(fontSize - FONT_SIZE.step))
fontUp.addEventListener("click", () => changeFontSize(fontSize + FONT_SIZE.step))
themeButton.addEventListener("click", () => {
  themePreference = nextThemePreference(themePreference)
  saveThemePreference(themePreference)
  applyTheme(themePreference)
  showPreferences()
})
showPreferences()

const sampleSelect = element<HTMLSelectElement>("samples")
sampleSelect.append(new Option("サンプルを選ぶ…", ""), ...SAMPLES.map((sample) => new Option(sample.title, sample.id)))
/** エディタの中身を入れ替える（元に戻す操作で、書いていたコードに戻せる） */
function replaceSource(text: string, focus: boolean): void {
  const model = editor.getModel()
  if (model === null) return
  editor.pushUndoStop()
  editor.executeEdits("replace", [{ range: model.getFullModelRange(), text }])
  editor.pushUndoStop()
  editor.setPosition({ lineNumber: 1, column: 1 })
  if (focus) editor.focus()
}

sampleSelect.addEventListener("change", () => {
  const sample = SAMPLES.find((candidate) => candidate.id === sampleSelect.value)
  sampleSelect.value = ""
  if (sample !== undefined) replaceSource(sample.source, true)
})

// チュートリアルの横に埋め込まれたとき：ロゴやサイトのリンクを隠し、親ページからコードを受け取る
if (new URLSearchParams(location.search).has("embed")) {
  document.body.classList.add("embed")
  window.addEventListener("message", (event: MessageEvent<unknown>) => {
    if (event.origin !== location.origin) return
    const data = event.data as { type?: unknown; source?: unknown } | null
    if (data?.type === "kururi:set-source" && typeof data.source === "string") replaceSource(data.source, false)
  })
}

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

function fixedSource(marker: EditorMarker): string | null {
  return marker.fix === undefined ? null : applyFix(editor.getValue(), marker, marker.fix)
}

/** 直し方を当てる（元に戻す操作で戻せる） */
function applyMarkerFix(marker: EditorMarker): void {
  const model = editor.getModel()
  const next = fixedSource(marker)
  if (model === null || next === null) return
  editor.pushUndoStop()
  editor.executeEdits("quick-fix", [{ range: model.getFullModelRange(), text: next }])
  editor.pushUndoStop()
  editor.focus()
}

// 電球（Ctrl+. / Cmd+.）からも、同じ直し方を使えるようにする
monaco.languages.registerCodeActionProvider(LANGUAGE_ID, {
  provideCodeActions(model, range) {
    const actions: monaco.languages.CodeAction[] = []
    for (const marker of currentAnalysis.markers) {
      const text = marker.fix === undefined ? null : fixedSource(marker)
      if (marker.fix === undefined || text === null) continue
      if (range.startLineNumber > marker.endLineNumber || range.endLineNumber < marker.startLineNumber) continue
      actions.push({
        title: marker.fix.title,
        kind: "quickfix",
        isPreferred: true,
        edit: { edits: [{ resource: model.uri, versionId: model.getVersionId(), textEdit: { range: model.getFullModelRange(), text } }] },
      })
    }
    return { actions, dispose() {} }
  },
})

const problemsList = element("problems")
function showProblems(markers: readonly EditorMarker[]): void {
  renderProblems(problemsList, markers, {
    jump: (marker) => {
      editor.setPosition({ lineNumber: marker.startLineNumber, column: marker.startColumn })
      editor.revealLineInCenterIfOutsideViewport(marker.startLineNumber)
      editor.focus()
    },
    fix: applyMarkerFix,
  })
}

let runLines: string[] = []
let savedOutput: Node[] | null = null
let pendingTrace: TraceResult | null = null
const stepButton = element<HTMLButtonElement>("step")
const stepHighlights = { kururi: editor.createDecorationsCollection(), python: pythonView.createDecorationsCollection() }

/** カーソルのある行と、対応する反対側の行を薄く示す（Kururi ↔ Python） */
const linkHighlights = { kururi: editor.createDecorationsCollection(), python: pythonView.createDecorationsCollection() }

function linkDecoration(line: number) {
  return { range: new monaco.Range(line, 1, line, 1), options: { isWholeLine: true, className: "kururi-link-line" } }
}

function showLinkedLines(from: "kururi" | "python", line: number): void {
  const { lineMap } = currentAnalysis
  if (from === "kururi") {
    linkHighlights.kururi.set([linkDecoration(line)])
    linkHighlights.python.set(pythonLinesFor(line, lineMap).map(linkDecoration))
    return
  }
  const kururiLine = kururiLineFor(line, lineMap)
  linkHighlights.python.set([linkDecoration(line)])
  linkHighlights.kururi.set(kururiLine === null ? [] : [linkDecoration(kururiLine)])
}

editor.onDidChangeCursorPosition((event) => showLinkedLines("kururi", event.position.lineNumber))
pythonView.onDidChangeCursorPosition((event) => showLinkedLines("python", event.position.lineNumber))

function highlightLine(collection: monaco.editor.IEditorDecorationsCollection, view: monaco.editor.IStandaloneCodeEditor, line: number | null): void {
  collection.set(line === null ? [] : [{ range: new monaco.Range(line, 1, line, 1), options: { isWholeLine: true, className: "kururi-step-line" } }])
  if (line !== null) view.revealLineInCenterIfOutsideViewport(line)
}

/** ステップ実行中は、出力を今の位置までに絞って見せ、閉じたら元に戻す */
function showStepOutput(lines: number | null): void {
  if (lines === null) {
    if (savedOutput !== null) output.replaceChildren(...savedOutput)
    savedOutput = null
    return
  }
  savedOutput ??= [...output.childNodes].map((node) => node.cloneNode(true))
  output.replaceChildren(
    ...runLines.slice(0, lines).map((text) => {
      const line = document.createElement("div")
      line.textContent = text
      return line
    }),
  )
}

const stepPanel = createStepPanel(element("stepper"), {
  highlight: (kururiLine, pythonLine) => {
    highlightLine(stepHighlights.kururi, editor, kururiLine)
    highlightLine(stepHighlights.python, pythonView, pythonLine)
  },
  showOutput: showStepOutput,
})

const runner = createRunner({
  onTrace: (trace) => {
    pendingTrace = trace
  },
  onInput: askInline,
  onOutput: (text) => {
    runLines = [...runLines, text]
    appendOutput(text)
  },
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
    stepButton.disabled = runButton.disabled
    stopButton.hidden = true
    if (pendingTrace !== null) stepPanel.open(pendingTrace, currentAnalysis.lineMap)
    pendingTrace = null
  },
})

function start(trace: boolean): void {
  stepPanel.close()
  output.replaceChildren()
  runLines = []
  pendingTrace = null
  markRuntimeError(null)
  runButton.disabled = true
  stepButton.disabled = true
  stopButton.hidden = false
  runner.run(currentAnalysis.python, { trace })
}

runButton.addEventListener("click", () => start(false))
stepButton.addEventListener("click", () => start(true))
stopButton.addEventListener("click", () => runner.stop())

function render(): void {
  const source = editor.getValue()
  const analysis = analyze(source)
  currentAnalysis = analysis
  renderLineIcons(source)
  showProblems(analysis.markers)
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
  if (stopButton.hidden) {
    runButton.disabled = analysis.errorCount > 0 || analysis.python === ""
    stepButton.disabled = runButton.disabled
  }
  saveSource(source)
}

editor.onDidChangeModelContent(() => stepPanel.close())
editor.onDidChangeModelContent(debounce(render, 200))
openButton.addEventListener("click", () => {
  if (currentUrl !== null) window.open(currentUrl, "_blank", "noopener")
})
render()
