/** 実行がこの時間を超えたら、無限ループとみなして止める（入力待ちの間は数えない）。 */
const TIMEOUT_MS = 10_000
/** 入力 1 回ぶんの最大バイト数 */
const INPUT_BYTES = 64 * 1024

export interface RunnerHandlers {
  readonly onOutput: (text: string) => void
  readonly onStatus: (text: string) => void
  readonly onError: (traceback: string) => void
  readonly onFinish: () => void
  /** input() が呼ばれたとき、画面で入力を受け取って返す。止められたら null */
  readonly onInput: (prompt: string) => Promise<string | null>
}

interface WorkerMessage {
  readonly type: "loading" | "running" | "stdout" | "input" | "done" | "error"
  readonly text?: string
  readonly prompt?: string
  readonly traceback?: string
}

export interface Runner {
  readonly run: (code: string) => void
  readonly stop: () => void
}

interface Buffers {
  readonly status: SharedArrayBuffer
  readonly data: SharedArrayBuffer
}

/** SharedArrayBuffer が使えるのは、ページが cross-origin isolated のときだけ。 */
function createBuffers(): Buffers | null {
  if (typeof SharedArrayBuffer === "undefined" || !crossOriginIsolated) return null
  return { status: new SharedArrayBuffer(4), data: new SharedArrayBuffer(INPUT_BYTES) }
}

/** Pyodide のワーカーを使って Python を実行する。止めるときはワーカーごと作り直す。 */
export function createRunner(handlers: RunnerHandlers): Runner {
  let worker: Worker | null = null
  let buffers: Buffers | null = null
  let timer: ReturnType<typeof setTimeout> | undefined

  function stopTimer(): void {
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
  }

  function finish(): void {
    stopTimer()
    handlers.onStatus("")
    handlers.onFinish()
  }

  function discard(): void {
    worker?.terminate()
    worker = null
    buffers = null
  }

  function startTimer(): void {
    stopTimer()
    timer = setTimeout(() => {
      discard()
      handlers.onError(`実行が ${TIMEOUT_MS / 1000} 秒を超えたので止めました。無限ループになっていないか確かめてください`)
      finish()
    }, TIMEOUT_MS)
  }

  async function answer(prompt: string, target: Worker, shared: Buffers | null): Promise<void> {
    stopTimer()
    const value = await handlers.onInput(prompt)
    // 入力待ちの間に止められていたら、古いワーカーには何も書かない
    if (shared === null || worker !== target) return
    const status = new Int32Array(shared.status)
    if (value === null) {
      Atomics.store(status, 0, -1)
    } else {
      const bytes = new TextEncoder().encode(value).slice(0, INPUT_BYTES)
      new Uint8Array(shared.data).set(bytes)
      Atomics.store(status, 0, bytes.length)
    }
    Atomics.notify(status, 0)
    startTimer()
  }

  function start(): Worker {
    const created = new Worker(`${import.meta.env.BASE_URL}pyodide-worker.js`)
    created.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const message = event.data
      if (message.type === "loading") handlers.onStatus("Python を準備しています…（初回は少し時間がかかります）")
      else if (message.type === "running") {
        handlers.onStatus("実行中…")
        // Python の読み込みに時間がかかっても止めないよう、制限時間は実行が始まってから数える
        startTimer()
      } else if (message.type === "stdout") handlers.onOutput(message.text ?? "")
      else if (message.type === "input") void answer(message.prompt ?? "", created, buffers)
      else if (message.type === "error") {
        handlers.onError(message.traceback ?? "")
        finish()
      } else finish()
    }
    created.onerror = () => {
      handlers.onError("Python の実行環境を読み込めませんでした。ネットワークを確かめてください")
      discard()
      finish()
    }
    return created
  }

  return {
    run(code) {
      if (worker === null) {
        buffers = createBuffers()
        worker = start()
      }
      worker.postMessage({ code, buffers })
    },
    stop() {
      discard()
      handlers.onOutput("（止めました）")
      finish()
    },
  }
}
