// Pyodide でユーザーのプログラムを動かすワーカー。
// 画面を固めないようワーカーで動かし、無限ループのときは呼び出し側が terminate で止める。
const PYODIDE_VERSION = "0.27.0"
importScripts(`https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/pyodide.js`)

let pyodidePromise = null
function loadRuntime() {
  if (pyodidePromise === null) pyodidePromise = loadPyodide()
  return pyodidePromise
}

self.onmessage = async (event) => {
  const { code, stdin } = event.data
  try {
    postMessage({ type: "loading" })
    const pyodide = await loadRuntime()
    const lines = stdin === "" ? [] : stdin.split("\n")
    // 入力は、あらかじめ書いてもらった行を 1 行ずつ渡す。足りなくなると Python が EOFError を出す
    pyodide.setStdin({ stdin: () => lines.shift() })
    pyodide.setStdout({ batched: (text) => postMessage({ type: "stdout", text }) })
    pyodide.setStderr({ batched: (text) => postMessage({ type: "stdout", text }) })
    postMessage({ type: "running" })
    await pyodide.runPythonAsync(code, { globals: pyodide.toPy({ __name__: "__main__" }) })
    postMessage({ type: "done" })
  } catch (error) {
    postMessage({ type: "error", traceback: String(error && error.message ? error.message : error) })
  }
}
