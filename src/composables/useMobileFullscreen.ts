import { ref, computed, onMounted, onBeforeUnmount, type ComputedRef } from 'vue'

/**
 * 移动端全屏与横屏适配：
 * - 首次用户手势（点击/触摸/按键）触发全屏 + 方向锁定（浏览器唯一放行时机）
 * - 竖屏触摸设备 → isPortraitTouch 供 CSS 旋转 90° 兜底
 * - 后台回前台 / pageshow / focus 时调用 onRecover 重启被节流的 RAF 循环
 *
 * @param onRecover 恢复游戏渲染循环的回调（App 传 canvas.resumeLoop()）
 */
export function useMobileFullscreen(onRecover: () => void): {
  isPortraitTouch: ComputedRef<boolean>
  tryFullscreen: () => Promise<void>
  tryLockLandscape: () => Promise<void>
  ensureFullscreen: () => void
} {
  /** 响应式窗口尺寸，让 computed 能追踪横竖屏切换 */
  const viewport = ref({
    w: typeof window !== 'undefined' ? window.innerWidth : 0,
    h: typeof window !== 'undefined' ? window.innerHeight : 0,
  })
  function updateViewport() {
    viewport.value = { w: window.innerWidth, h: window.innerHeight }
  }

  /** 竖屏触摸设备检测 → CSS 旋转兜底（安卓 Chrome 会优先尝试原生横屏锁定） */
  const isPortraitTouch = computed(() => {
    if (typeof window === 'undefined') return false
    const isCoarse = window.matchMedia('(pointer: coarse)').matches
    const isPortrait = viewport.value.h > viewport.value.w
    return isCoarse && isPortrait
  })

  /** 尝试进入全屏（所有触摸设备都尝试，让画面撑满整个屏幕隐藏地址栏） */
  async function tryFullscreen(): Promise<void> {
    try {
      const doc = document as Document & {
        webkitFullscreenElement?: Element | null
      }
      const el = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void>
      }
      if (doc.fullscreenElement || doc.webkitFullscreenElement) return
      const req =
        el.requestFullscreen?.bind(el) ?? el.webkitRequestFullscreen?.bind(el)
      if (req) await req()
    } catch {
      /* iOS Safari 不支持，静默失败 */
    }
  }

  /** 竖屏触摸设备：全屏后再尝试方向锁定（安卓 Chrome 有效，iOS 失败） */
  async function tryLockLandscape(): Promise<void> {
    if (!isPortraitTouch.value) return
    await tryFullscreen()
    try {
      const so = screen.orientation as ScreenOrientation & {
        lock?: (o: string) => Promise<void>
      }
      if (so?.lock) await so.lock('landscape')
    } catch {
      /* 浏览器不支持 → 由 CSS 旋转 90° 呈现横屏画面 */
    }
  }

  /** 全屏 + 方向锁定（fire-and-forget，开跑/重开/开始游玩等入口统一调用） */
  function ensureFullscreen(): void {
    tryFullscreen()
    tryLockLandscape()
  }

  // 监听旋转 / 尺寸变化，更新响应式数据
  if (typeof window !== 'undefined') {
    window.addEventListener('orientationchange', updateViewport)
    window.addEventListener('resize', updateViewport)
  }

  /** 首次用户手势必触发全屏 + 方向锁定（浏览器唯一放行全屏调用的时机） */
  let onceOnFirstGesture: (() => void) | null = null

  function cleanupFirstGestureListener() {
    if (!onceOnFirstGesture) return
    document.removeEventListener('click', onceOnFirstGesture, true)
    document.removeEventListener('touchstart', onceOnFirstGesture, true)
    document.removeEventListener('keydown', onceOnFirstGesture, true)
    onceOnFirstGesture = null
  }

  function onVisibilityChange() {
    if (document.visibilityState === 'visible') onRecover()
  }
  function onPageShow() {
    onRecover()
  }
  function onWindowFocus() {
    onRecover()
  }

  onMounted(() => {
    // 手机浏览器在后台/无交互时会节流 RAF，切回前台时手动重启循环
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('pageshow', onPageShow)
    window.addEventListener('focus', onWindowFocus)

    // 注意：不能在挂载时无手势调用 requestFullscreen —— 浏览器会拒绝并在控制台报
    // SecurityError 警告。全屏统一交给下面的"首次用户手势"监听器处理。
    // 首次用户手势（点击/触摸/按键）必触发全屏 —— 这是浏览器唯一放行的时机
    onceOnFirstGesture = () => {
      ensureFullscreen()
      onRecover() // 同时兜底重启 RAF
      cleanupFirstGestureListener()
    }
    document.addEventListener('click', onceOnFirstGesture, true)
    document.addEventListener('touchstart', onceOnFirstGesture, true)
    document.addEventListener('keydown', onceOnFirstGesture, true)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('orientationchange', updateViewport)
    window.removeEventListener('resize', updateViewport)
    document.removeEventListener('visibilitychange', onVisibilityChange)
    window.removeEventListener('pageshow', onPageShow)
    window.removeEventListener('focus', onWindowFocus)
    cleanupFirstGestureListener()
  })

  return { isPortraitTouch, tryFullscreen, tryLockLandscape, ensureFullscreen }
}
