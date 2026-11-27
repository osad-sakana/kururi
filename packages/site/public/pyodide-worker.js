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

// ステップ実行用：実行の途中経過（行と変数）を記録する。画面側が、あとで行き来して見せる。
const MAX_TRACE_STEPS = 3000

function installTrace(pyodide, onStep) {
  pyodide.registerJsModule("_kururi_trace", { record: onStep })
  pyodide.runPython(`
import sys, json, types
from _kururi_trace import record

_kururi_count = 0

def _kururi_type(v):
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "boolean"
    if isinstance(v, int):
        return "int"
    if isinstance(v, float):
        return "float"
    if isinstance(v, str):
        return "string"
    if isinstance(v, list):
        return (_kururi_type(v[0]) + "[]") if v else "配列"
    return type(v).__name__

def _kururi_show(v, depth=0):
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, str):
        return json.dumps(v, ensure_ascii=False)
    if isinstance(v, list):
        if depth > 2:
            return "[…]"
        return "[" + ", ".join(_kururi_show(x, depth + 1) for x in v[:20]) + ("…" if len(v) > 20 else "") + "]"
    if hasattr(v, "__dict__") and not isinstance(v, (types.FunctionType, type, types.ModuleType)):
        if depth > 2:
            return type(v).__name__ + "{…}"
        inner = ", ".join(k + "=" + _kururi_show(x, depth + 1) for k, x in vars(v).items())
        return type(v).__name__ + "(" + inner + ")"
    return str(v)

def _kururi_vars(frame):
    rows = []
    for name, value in list(frame.f_locals.items()):
        if name.startswith("_") or isinstance(value, (types.FunctionType, type, types.ModuleType)):
            continue
        rows.append([name, _kururi_type(value), _kururi_show(value)])
    return rows

def _kururi_tracer(frame, event, arg):
    global _kururi_count
    if frame.f_globals.get("__name__") != "__main__" or frame.f_code.co_name.startswith("_kururi_"):
        return None
    if event == "line":
        if _kururi_count >= ${MAX_TRACE_STEPS}:
            sys.settrace(None)
            record(-1, "", "[]")
            return None
        _kururi_count += 1
        record(frame.f_lineno, frame.f_code.co_name, json.dumps(_kururi_vars(frame), ensure_ascii=False))
    return _kururi_tracer
`)
}

self.onmessage = async (event) => {
  const { code, buffers, trace } = event.data
  let outputCount = 0
  const steps = []
  let truncated = false
  try {
    postMessage({ type: "loading" })
    const pyodide = await loadRuntime()
    installInput(pyodide, buffers)
    pyodide.setStdout({ batched: (text) => postMessage({ type: "stdout", text }) })
    pyodide.setStderr({ batched: (text) => postMessage({ type: "stdout", text }) })
    if (trace) {
      pyodide.setStdout({ batched: (text) => { outputCount += 1; postMessage({ type: "stdout", text }) } })
      installTrace(pyodide, (line, fn, json) => {
        if (line < 0) truncated = true
        else steps.push({ line, fn, vars: JSON.parse(json), out: outputCount })
      })
    }
    postMessage({ type: "running" })
    try {
      if (trace) pyodide.runPython("import sys; sys.settrace(_kururi_tracer)")
      await pyodide.runPythonAsync(code, { globals: pyodide.toPy({ __name__: "__main__" }) })
    } finally {
      if (trace) pyodide.runPython("import sys; sys.settrace(None)")
    }
    if (trace) postMessage({ type: "trace", steps, truncated, total: outputCount })
    postMessage({ type: "done" })
  } catch (error) {
    // エラーで止まったときも、そこまでの経過は見られるようにする
    if (trace && steps.length > 0) postMessage({ type: "trace", steps, truncated, total: outputCount })
    postMessage({ type: "error", traceback: String(error && error.message ? error.message : error) })
  }
}
