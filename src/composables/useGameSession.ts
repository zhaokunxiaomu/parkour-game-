import { ref, watch, onMounted, onBeforeUnmount, type Ref } from 'vue'
import type { GameState, Level, PickupType } from '../game'
import { LEVELS } from '../game'
import type { FloatText, GameCanvasHandle } from './types'

const BEST_KEY = 'parkour-best-score'
const SFX_KEY = 'parkour-sfx-enabled'
const TUTORIAL_KEY = 'parkour-tutorial-seen'

export interface GameSessionOptions {
  canvas: Ref<GameCanvasHandle | null>
  /** 全屏 + 方向锁定（开跑/重开/开始游玩入口统一调用） */
  ensureFullscreen: () => void
}

/**
 * 游戏会话：状态机数据、引擎回调接线、localStorage 持久化、
 * 关卡进度轮询、道具飘字、新手引导与音效开关、开始/重开/回菜单动作。
 */
export function useGameSession({ canvas, ensureFullscreen }: GameSessionOptions) {
  const state = ref<GameState>('menu')
  const score = ref(0)
  const best = ref(0)

  const levelIndex = ref(0)
  const currentLevel = ref<Level>(LEVELS[0])
  const progressRatio = ref(0) // 关卡进度 0~1
  const introPending = ref(false) // transition 期间是否为开局提示

  const sfxEnabled = ref(true)

  /** 道具状态 */
  const floatTexts = ref<FloatText[]>([])
  let floatId = 0
  const isShielded = ref(false) // 是否激活护盾（UI 显示用）

  /** 新手引导：首次点开始先弹图文轮播；主菜单「?」可随时重看 */
  const tutorialSeen = ref(true)
  const showTutorial = ref(false)
  let tutorialFromStart = false

  // 每帧更新关卡进度（playing 时）
  let progressTimerId: number | null = null
  function startProgressTicker() {
    stopProgressTicker()
    progressTimerId = window.setInterval(() => {
      const p = canvas.value?.getLevelProgress()
      if (p) progressRatio.value = p.ratio
    }, 100)
  }
  function stopProgressTicker() {
    if (progressTimerId !== null) {
      clearInterval(progressTimerId)
      progressTimerId = null
    }
  }

  onMounted(() => {
    const saved = Number(localStorage.getItem(BEST_KEY) || 0)
    if (!Number.isNaN(saved)) best.value = saved
    sfxEnabled.value = localStorage.getItem(SFX_KEY) !== '0'
    tutorialSeen.value = localStorage.getItem(TUTORIAL_KEY) === '1'
    canvas.value?.setSfxEnabled(sfxEnabled.value)
  })

  onBeforeUnmount(stopProgressTicker)

  // 状态切换时控制进度条
  watch(state, (s) => {
    if (s === 'playing') startProgressTicker()
    else if (s === 'paused' || s === 'transition') {
      /* 保持当前进度显示 */
    } else stopProgressTicker()
  })

  /* ---------- 引擎回调 ---------- */
  function onScore(s: number) {
    score.value = s
  }
  function onState(s: GameState) {
    state.value = s
    if (s === 'transition') introPending.value = canvas.value?.isIntroPending() ?? false
  }
  function onGameOver(s: number) {
    isShielded.value = false // 游戏结束清护盾 UI
    if (s > best.value) {
      best.value = s
      localStorage.setItem(BEST_KEY, String(s))
    }
  }
  function onPickup(type: PickupType) {
    const text = type === 'coin' ? '+20' : type === 'shield' ? '护盾' : '冲刺'
    const id = ++floatId
    floatTexts.value.push({ id, type, text })
    setTimeout(() => {
      floatTexts.value = floatTexts.value.filter((f) => f.id !== id)
    }, 1200)
    if (type === 'shield') isShielded.value = true
    if (type === 'boost') isShielded.value = false
  }
  function onLevelChange(i: number, lv: Level) {
    levelIndex.value = i
    currentLevel.value = lv
    progressRatio.value = 0
  }
  function onVictory() {
    /* 什么都不用做，蒙层靠 state='victory' 自动显示 */
  }

  /* ---------- 动作 ---------- */
  function startGame() {
    isShielded.value = false
    ensureFullscreen()
    canvas.value?.start()
  }
  function handleStart() {
    // 首次游玩：先弹新手图文引导，看完（或跳过）再真正开跑
    if (!tutorialSeen.value) {
      tutorialFromStart = true
      showTutorial.value = true
      return
    }
    startGame()
  }
  /** 引导轮播完成：从「开始游戏」进入则标记已看过并开跑；从「?」进入则仅关闭 */
  function handleTutorialDone() {
    showTutorial.value = false
    if (tutorialFromStart) {
      tutorialFromStart = false
      tutorialSeen.value = true
      localStorage.setItem(TUTORIAL_KEY, '1')
      startGame()
    }
  }
  function openTutorialFromHelp() {
    tutorialFromStart = false
    showTutorial.value = true
  }
  function handleRestart() {
    isShielded.value = false
    ensureFullscreen()
    canvas.value?.restart()
  }
  function handleBeginPlay() {
    ensureFullscreen()
    canvas.value?.beginPlay()
  }
  function handleBackToMenu() {
    canvas.value?.returnToMenu()
    state.value = 'menu'
    progressRatio.value = 0
  }
  function toggleSfx() {
    sfxEnabled.value = !sfxEnabled.value
    localStorage.setItem(SFX_KEY, sfxEnabled.value ? '1' : '0')
    canvas.value?.setSfxEnabled(sfxEnabled.value)
  }
  function pauseGame() {
    canvas.value?.pause()
  }

  return {
    state,
    score,
    best,
    levelIndex,
    currentLevel,
    progressRatio,
    introPending,
    sfxEnabled,
    floatTexts,
    isShielded,
    showTutorial,
    onScore,
    onState,
    onGameOver,
    onPickup,
    onLevelChange,
    onVictory,
    handleStart,
    handleRestart,
    handleBeginPlay,
    handleBackToMenu,
    handleTutorialDone,
    openTutorialFromHelp,
    toggleSfx,
    pauseGame,
  }
}
