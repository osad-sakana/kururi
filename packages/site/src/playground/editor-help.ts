import * as monaco from "monaco-editor/esm/vs/editor/editor.api"
import { generalSuggestions, helpFor, indexSymbols, memberSuggestions, type Suggestion } from "./symbols"

const MEMBER_ACCESS = /([\p{L}_][\p{L}\p{N}_]*)\.$/u

const KINDS: Readonly<Record<Suggestion["kind"], monaco.languages.CompletionItemKind>> = {
  keyword: monaco.languages.CompletionItemKind.Keyword,
  type: monaco.languages.CompletionItemKind.TypeParameter,
  builtin: monaco.languages.CompletionItemKind.Function,
  variable: monaco.languages.CompletionItemKind.Variable,
  function: monaco.languages.CompletionItemKind.Function,
  class: monaco.languages.CompletionItemKind.Class,
  member: monaco.languages.CompletionItemKind.Method,
}

/** 補完（キーワード・型・組み込み・宣言した名前・`x.` のあとのメンバー）と、名前にカーソルを置いたときの説明。 */
export function registerEditorHelp(languageId: string): void {
  monaco.languages.registerCompletionItemProvider(languageId, {
    triggerCharacters: ["."],
    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position)
      const range = { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn }
      const before = model.getValueInRange({ startLineNumber: position.lineNumber, startColumn: 1, endLineNumber: position.lineNumber, endColumn: word.startColumn })
      const symbols = indexSymbols(model.getValue())
      const object = MEMBER_ACCESS.exec(before)?.[1]
      const items = object === undefined ? generalSuggestions(symbols) : memberSuggestions(symbols, object, position.lineNumber)
      return {
        suggestions: items.map((item) => ({
          label: item.label,
          kind: KINDS[item.kind],
          detail: item.detail,
          insertText: item.insert ?? item.label,
          range,
        })),
      }
    },
  })

  monaco.languages.registerHoverProvider(languageId, {
    provideHover(model, position) {
      const word = model.getWordAtPosition(position)
      if (word === null) return null
      const help = helpFor(word.word, indexSymbols(model.getValue()), position.lineNumber)
      if (help === undefined) return null
      return {
        range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn),
        contents: [{ value: `\`${help}\`` }],
      }
    },
  })
}
