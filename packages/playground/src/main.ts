import * as monaco from "monaco-editor/esm/vs/editor/editor.api"
import "monaco-editor/esm/vs/basic-languages/python/python.contribution"
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker"
import { analyze, debounce, narapyUrl } from "./analyze"
import { LANGUAGE_ID, monarchDefinition } from "./language"
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
let currentUrl: string | null = null

function render(): void {
  const source = editor.getValue()
  const analysis = analyze(source)
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
  saveSource(source)
}

editor.onDidChangeModelContent(debounce(render, 200))
openButton.addEventListener("click", () => {
  if (currentUrl !== null) window.open(currentUrl, "_blank", "noopener")
})
render()
