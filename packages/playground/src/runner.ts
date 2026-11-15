/** 実行がこの時間を超えたら、無限ループとみなして止める。 */
const TIMEOUT_MS = 10_000

export interface RunnerHandlers {
  readonly onOutput: (text: string) => void
  readonly onStatus: (text: string) => void
  readonly onError: (traceback: string) => void
  readonly onFinish: () => void
}

interface WorkerMessage {
  readonly type: "loading" | "running" | "stdout" | "done" | "error"
  readonly text?: string
  readonly traceback?: string
}

export interface Runner {
  readonly run: (code: string, stdin: string) => void
  readonly stop: () => void
}

/** Pyodide のワーカーを使って Python を実行する。止めるときはワーカーごと作り直す。 */
export function createRunner(handlers: RunnerHandlers): Runner {
  let worker: Worker | null = null
  let timer: ReturnType<typeof setTimeout> | undefined

  function finish(): void {
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
    handlers.onStatus("")
    handlers.onFinish()
  }

  function discard(): void {
    worker?.terminate()
    worker = null
  }

  function start(): Worker {
    const created = new Worker(`${import.meta.env.BASE_URL}pyodide-worker.js`)
    created.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const message = event.data
      if (message.type === "loading") handlers.onStatus("Python を準備しています…（初回は少し時間がかかります）")
      else if (message.type === "running") {
        handlers.onStatus("実行中…")
        // Python の読み込みに時間がかかっても止めないよう、制限時間は実行が始まってから数える
        timer = setTimeout(() => {
          discard()
          handlers.onError(`実行が ${TIMEOUT_MS / 1000} 秒を超えたので止めました。無限ループになっていないか確かめてください`)
          finish()
        }, TIMEOUT_MS)
      }
      else if (message.type === "stdout") handlers.onOutput(message.text ?? "")
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
    run(code, stdin) {
      worker ??= start()
      worker.postMessage({ code, stdin })
    },
    stop() {
      discard()
      handlers.onOutput("（止めました）")
      finish()
    },
  }
}
