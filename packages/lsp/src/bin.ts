#!/usr/bin/env -S pnpm exec tsx
import { TextDocument } from "vscode-languageserver-textdocument"
import {
  createConnection,
  ProposedFeatures,
  TextDocumentSyncKind,
  TextDocuments,
} from "vscode-languageserver/node"
import { toLspDiagnostics } from "./diagnostics"

/** 標準入出力でつなぐ Kururi の言語サーバー。開いている・編集中のファイルの診断を返す。 */
const connection = createConnection(ProposedFeatures.all)
const documents = new TextDocuments(TextDocument)

connection.onInitialize(() => ({
  capabilities: { textDocumentSync: TextDocumentSyncKind.Full },
}))

documents.onDidChangeContent(({ document }) => {
  void connection.sendDiagnostics({ uri: document.uri, diagnostics: toLspDiagnostics(document.getText()) })
})
documents.onDidClose(({ document }) => {
  void connection.sendDiagnostics({ uri: document.uri, diagnostics: [] })
})

documents.listen(connection)
connection.listen()
