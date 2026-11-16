export const SAMPLE = `
function main = () {
    output("掛け算九九の表")
    output("=================")

    // 外側のループ（i は 0 から 8 まで）
    for i in 0..9 {
        var row: string = ""

        // 内側のループ（j は 0 から 8 まで）
        for j in 0..9 {
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
        output(row)
    }
}
`.trimStart()
