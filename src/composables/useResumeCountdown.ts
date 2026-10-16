import { ref, onBeforeUnmount, type Ref } from 'vue'

/**
 * 继续游戏 3 秒倒计时：点「继续」后先倒数 3-2-1，
 * 倒数结束才调用 onFinish（真正解除暂停），避免玩家未准备好就直接开跑。
 */
export function useResumeCountdown(onFinish: () => void): {
  resumeCountdown: Ref<number | null>
  start: () => void
  stop: () => void
} {
  /** null = 无倒计时，3/2/1 = 正在倒数 */
  const resumeCountdown = ref<number | null>(null)
  let timer: number | null = null

  function start(): void {
    stop()
    resumeCountdown.value = 3
    timer = window.setInterval(() => {
      if (resumeCountdown.value === null) {
        stop()
        return
      }
      resumeCountdown.value -= 1
      if (resumeCountdown.value <= 0) {
        stop()
        onFinish() // 最后才真正解除暂停
      }
    }, 1000)
  }

  function stop(): void {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
    resumeCountdown.value = null
  }

  onBeforeUnmount(stop)

  return { resumeCountdown, start, stop }
}
