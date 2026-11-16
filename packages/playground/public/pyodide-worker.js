// Pyodide でユーザーのプログラムを動かすワーカー。
// 画面を固めないようワーカーで動かし、無限ループのときは呼び出し側が terminate で止める。
const PYODIDE_VERSION = "0.27.0"
importScripts(`https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/pyodide.js`)

let pyodidePromise = null
function loadRuntime() {
  if (pyodidePromise === null) pyodidePromise = loadPyodide()
  return pyodidePromise
}

// input() は、画面側で入力が済むまで Atomics.wait で待つ（入力欄は画面側がインラインで出す）。
function installInput(pyodide, buffers) {
  const readInput = (prompt) => {
    if (!buffers) throw new Error("この環境では input() を使えません。ページを再読み込みしてください")
    const status = new Int32Array(buffers.status)
    const data = new Uint8Array(buffers.data)
    Atomics.store(status, 0, 0)
    postMessage({ type: "input", prompt })
    Atomics.wait(status, 0, 0)
    const length = Atomics.load(status, 0)
    if (length < 0) return null
    return new TextDecoder().decode(data.slice(0, length))
  }
  pyodide.registerJsModule("_kururi_io", { read_input: readInput })
  pyodide.runPython(`
import builtins, sys
from _kururi_io import read_input

def _kururi_input(prompt=""):
    sys.stdout.flush()
    value = read_input(str(prompt))
    if value is None:
        raise KeyboardInterrupt()
    return value

builtins.input = _kururi_input
`)
}

self.onmessage = async (event) => {
  const { code, buffers } = event.data
  try {
    postMessage({ type: "loading" })
    const pyodide = await loadRuntime()
    installInput(pyodide, buffers)
    pyodide.setStdout({ batched: (text) => postMessage({ type: "stdout", text }) })
    pyodide.setStderr({ batched: (text) => postMessage({ type: "stdout", text }) })
    postMessage({ type: "running" })
    await pyodide.runPythonAsync(code, { globals: pyodide.toPy({ __name__: "__main__" }) })
    postMessage({ type: "done" })
  } catch (error) {
    postMessage({ type: "error", traceback: String(error && error.message ? error.message : error) })
  }
}
