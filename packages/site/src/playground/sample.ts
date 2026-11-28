export const SAMPLE = `
function main = () {
    print("掛け算九九の表")
    print("=================")

    // 外側のループ（i は 0 から 8 まで）
    for i 9 times {
        var row: string = ""

        // 内側のループ（j は 0 から 8 まで）
        for j 9 times {
            // ループ変数は 0 始まりなので、九九の段・列は +1 する
            var num1: int = i + 1
            var num2: int = j + 1
            var result: int = num1 * num2

            // 結果を行に追加
            // 幅を揃えるため、結果が1桁の場合はスペースを追加
            if result < 10 {
                row = row + \` \${result} \`
            } else {
                row = row + \`\${result} \`
            }
        }

        // 行を出力
        print(row)
    }
}
`.trimStart()

/** はじめて開いたときの中身：main の枠だけ。学習者は、枠の中に書くだけで始められる。 */
export const START_SOURCE = "function main = () {\n    \n}\n"

/** START_SOURCE のカーソル位置（2 行目の字下げの後ろ） */
export const START_CURSOR = { lineNumber: 2, column: 5 } as const
