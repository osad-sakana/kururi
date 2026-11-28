import { BUILTIN_NAMES, KEYWORDS } from "@kururi/compiler"

const TYPE_NAMES = new Set(["int", "float", "string", "boolean"])
const LITERAL_NAMES = new Set(["true", "false", "null"])

/** Monaco（Monarch）の字句定義。色付けだけで、構文の検査はコンパイラが行う。 */
export function monarchDefinition() {
  const keywords = [...KEYWORDS].filter((word) => !TYPE_NAMES.has(word) && !LITERAL_NAMES.has(word))
  return {
    keywords,
    typeKeywords: [...TYPE_NAMES],
    constants: [...LITERAL_NAMES],
    builtins: [...BUILTIN_NAMES],
    tokenizer: {
      root: [
        [/\/\/.*$/, "comment"],
        [/"/, { token: "string", next: "@template" }],
        [/\d+\.\d+/, "number.float"],
        [/\d+/, "number"],
        [
          /[A-Za-z_][A-Za-z0-9_]*/,
          {
            cases: {
              "@keywords": "keyword",
              "@typeKeywords": "type",
              "@constants": "constant",
              "@builtins": "predefined",
              "@default": "identifier",
            },
          },
        ],
      ],
      template: [
        [/\$\{/, { token: "delimiter.bracket", next: "@templateExpr" }],
        [/\\./, "string.escape"],
        [/"/, { token: "string", next: "@pop" }],
        [/[^"$\\]+|\$/, "string"],
      ],
      templateExpr: [
        [/\}/, { token: "delimiter.bracket", next: "@pop" }],
        { include: "root" },
      ],
    },
  }
}

export const LANGUAGE_ID = "kururi"
