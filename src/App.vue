<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import GameCanvas from './components/GameCanvas.vue'
import StartScreen from './components/StartScreen.vue'
import GameOverScreen from './components/GameOverScreen.vue'
import PauseScreen from './components/PauseScreen.vue'
import LevelTransition from './components/LevelTransition.vue'
import VictoryScreen from './components/VictoryScreen.vue'
import ScoreHUD from './components/ScoreHUD.vue'
import type { GameState, Level, PickupType } from './game'
import { LEVELS } from './game'
import { THEMES } from './game/utils'

/** 根据当前关卡主题算出画布外围的背景色，保证各关卡画面无缝融合 */
const wrapperBg = computed(() => THEMES[currentLevel.value.theme].skyTop)

const gameCanvasRef = ref<InstanceType<typeof GameCanvas> | null>(null)
const state = ref<GameState>('menu')
const score = ref(0)
const best = ref(0)

const levelIndex = ref(0)
const currentLevel = ref<Level>(LEVELS[0])
const progressRatio = ref(0) // 关卡进度 0~1
const introPending = ref(false) // transition 期间是否为开局提示

const sfxEnabled = ref(true)

/** 继续游戏倒计时：null = 无倒计时，3/2/1 = 正在倒数 */
const resumeCountdown = ref<number | null>(null)
let resumeCountdownTimer: number | null = null

/** 道具状态 */
const floatTexts = ref<{ id: number; type: PickupType; text: string }[]>([])
let floatId = 0
const isShielded = ref(false) // 是否激活护盾（UI 显示用）

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
// 监听旋转 / 尺寸变化，更新响应式数据
if (typeof window !== 'undefined') {
  window.addEventListener('orientationchange', updateViewport)
  window.addEventListener('resize', updateViewport)
}

const BEST_KEY = 'parkour-best-score'
const SFX_KEY = 'parkour-sfx-enabled'

// 每帧更新关卡进度（playing 时）
let progressTimerId: number | null = null
function startProgressTicker() {
  stopProgressTicker()
  progressTimerId = window.setInterval(() => {
    const p = gameCanvasRef.value?.getLevelProgress()
    if (p) progressRatio.value = p.ratio
  }, 100)
}
function stopProgressTicker() {
  if (progressTimerId !== null) {
    clearInterval(progressTimerId)
    progressTimerId = null
  }
}

/** 首次用户手势必触发全屏 + 方向锁定（浏览器唯一放行全屏调用的时机） */
let onceOnFirstGesture: (() => void) | null = null

onMounted(() => {
  const saved = Number(localStorage.getItem(BEST_KEY) || 0)
  if (!Number.isNaN(saved)) best.value = saved
  sfxEnabled.value = localStorage.getItem(SFX_KEY) !== '0'
  gameCanvasRef.value?.setSfxEnabled(sfxEnabled.value)

  window.addEventListener('keydown', onKey)
  window.addEventListener('keyup', onKeyUp)
  // 手机浏览器在后台/无交互时会节流 RAF，切回前台时手动重启循环
  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('pageshow', onPageShow)
  window.addEventListener('focus', onWindowFocus)

  // 页面挂载后立即尝试一次全屏（某些 WebView/PWA 允许无手势调用）
  tryFullscreen()
  // 首次用户手势（点击/触摸/按键）必触发全屏 —— 这是浏览器唯一放行的时机
  onceOnFirstGesture = () => {
    tryFullscreen()
    tryLockLandscape()
    gameCanvasRef.value?.resumeLoop() // 同时兜底重启 RAF
    cleanupFirstGestureListener()
  }
  document.addEventListener('click', onceOnFirstGesture, true)
  document.addEventListener('touchstart', onceOnFirstGesture, true)
  document.addEventListener('keydown', onceOnFirstGesture, true)
})

function onVisibilityChange() {
  if (document.visibilityState === 'visible') {
    gameCanvasRef.value?.resumeLoop()
  }
}
function onPageShow() {
  gameCanvasRef.value?.resumeLoop()
}
function onWindowFocus() {
  gameCanvasRef.value?.resumeLoop()
}

function cleanupFirstGestureListener() {
  if (!onceOnFirstGesture) return
  document.removeEventListener('click', onceOnFirstGesture, true)
  document.removeEventListener('touchstart', onceOnFirstGesture, true)
  document.removeEventListener('keydown', onceOnFirstGesture, true)
  onceOnFirstGesture = null
}

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('orientationchange', updateViewport)
  window.removeEventListener('resize', updateViewport)
  document.removeEventListener('visibilitychange', onVisibilityChange)
  window.removeEventListener('pageshow', onPageShow)
  window.removeEventListener('focus', onWindowFocus)
  stopProgressTicker()
  cleanupFirstGestureListener()
})

// 状态切换时控制进度条
watch(state, (s) => {
  if (s === 'playing') startProgressTicker()
  else if (s === 'paused' || s === 'transition') {
    /* 保持当前进度显示 */
  } else stopProgressTicker()
})

function onKey(e: KeyboardEvent) {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    e.preventDefault()
    if (state.value === 'playing') handleJump()
    // menu / intro / paused / over / victory：不响应空格，必须点击蒙层按钮
  } else if (e.code === 'KeyP' || e.code === 'Escape') {
    e.preventDefault()
    if (state.value === 'playing') handlePause()
    // paused：不响应键盘继续，必须点"继续"按钮
  } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
    e.preventDefault()
    if (state.value === 'playing') gameCanvasRef.value?.crouch(true)
  } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
    e.preventDefault()
    if (state.value === 'playing') gameCanvasRef.value?.dash()
  }
}

function onKeyUp(e: KeyboardEvent) {
  // 松开下方向键 → 结束下蹲（持续状态只在按住时生效）
  if (e.code === 'ArrowDown' || e.code === 'KeyS') {
    gameCanvasRef.value?.crouch(false)
  }
}

function togglePause() {
  if (state.value === 'playing') handlePause()
  else if (state.value === 'paused') handleResume()
}

function handleJump() {
  gameCanvasRef.value?.jump()
}
function handlePause() {
  stopResumeCountdown()
  gameCanvasRef.value?.pause()
}
function handleResume() {
  // 显示 3 秒倒计时，让玩家准备好再真正进入 playing
  resumeCountdown.value = 3
  resumeCountdownTimer = window.setInterval(() => {
    if (resumeCountdown.value === null) {
      stopResumeCountdown()
      return
    }
    resumeCountdown.value -= 1
    if (resumeCountdown.value <= 0) {
      stopResumeCountdown()
      resumeCountdown.value = null
      gameCanvasRef.value?.resume() // 最后才真正解除暂停
    }
  }, 1000)
}
function stopResumeCountdown() {
  if (resumeCountdownTimer !== null) {
    clearInterval(resumeCountdownTimer)
    resumeCountdownTimer = null
  }
  resumeCountdown.value = null
}
function handleBackToMenu() {
  gameCanvasRef.value?.returnToMenu()
  state.value = 'menu'
  progressRatio.value = 0
}

function toggleSfx() {
  sfxEnabled.value = !sfxEnabled.value
  localStorage.setItem(SFX_KEY, sfxEnabled.value ? '1' : '0')
  gameCanvasRef.value?.setSfxEnabled(sfxEnabled.value)
}

function onScore(s: number) {
  score.value = s
}
function onState(s: GameState) {
  state.value = s
  if (s === 'transition')
    introPending.value = gameCanvasRef.value?.isIntroPending() ?? false
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

function handleStart() {
  isShielded.value = false
  tryFullscreen()
  tryLockLandscape()
  gameCanvasRef.value?.start()
}
function handleRestart() {
  isShielded.value = false
  tryFullscreen()
  tryLockLandscape()
  gameCanvasRef.value?.restart()
}
function handleBeginPlay() {
  tryFullscreen()
  tryLockLandscape()
  gameCanvasRef.value?.beginPlay()
}
function onLevelChange(i: number, lv: Level) {
  levelIndex.value = i
  currentLevel.value = lv
  progressRatio.value = 0
}
function onVictory() {
  /* App 层面什么都不用做，蒙层靠 state='victory' 自动显示 */
}

const showStart = computed(() => state.value === 'menu')
const showOver = computed(() => state.value === 'over')
const showPaused = computed(
  () => state.value === 'paused' && resumeCountdown.value === null
)
const showResumeCountdown = computed(() => resumeCountdown.value !== null)
const showTransition = computed(() => state.value === 'transition')
/** 第一关开局提示：无进度条、点按钮开始 */
const isIntroTransition = computed(
  () => state.value === 'transition' && introPending.value
)
/** 过渡蒙层展示的关卡：过关过渡时展示下一关，开局提示展示当前关 */
const transitionLevelIndex = computed(() =>
  isIntroTransition.value ? levelIndex.value : levelIndex.value + 1
)
const transitionLevel = computed(() => LEVELS[transitionLevelIndex.value])
const showVictory = computed(() => state.value === 'victory')
const showHUD = computed(() => state.value === 'playing')
const showPauseBtn = computed(() => state.value === 'playing')
const showLevelInfo = computed(
  () =>
    state.value === 'playing' ||
    state.value === 'paused' ||
    state.value === 'transition'
)
function onCanvasClick() {
  if (state.value === 'playing') handleJump()
}
</script>

<template>
  <div
    class="app"
    :class="{ 'app-rotated': isPortraitTouch }"
    :style="{ background: wrapperBg }"
  >
    <div class="game-wrapper">
      <GameCanvas
        ref="gameCanvasRef"
        :theme="currentLevel.theme"
        @click="onCanvasClick"
        @score="onScore"
        @state="onState"
        @gameover="onGameOver"
        @levelchange="onLevelChange"
        @victory="onVictory"
        @pickup="onPickup"
      />

      <!-- 右下角键盘操作提示：playing/paused 时显示，半透明不挡视线 -->
      <div v-if="state === 'playing' || state === 'paused'" class="hint-corner">
        <span>跳跃 空格/↑</span>
        <span>下蹲 ↓/S</span>
        <span>冲刺 Shift</span>
        <span>暂停 P</span>
      </div>

      <!-- 右上角控制：暂停 -->
      <button
        v-if="showPauseBtn"
        class="ctrl-btn pause-btn"
        @click.stop="togglePause"
        title="暂停 (P)"
      >
        ‖
      </button>

      <!-- HUD：分数 + 关卡名 + 进度条 -->
      <ScoreHUD v-if="showHUD" :score="score" />
      <div v-if="showLevelInfo && !showTransition" class="level-info">
        <span class="level-name">{{ currentLevel.name }}</span>
        <span class="level-progress">
          {{ Math.floor(progressRatio * 100) }}%
        </span>
        <div class="level-bar">
          <div
            class="level-fill"
            :style="{ width: progressRatio * 100 + '%' }"
          />
        </div>
        <span class="level-target">目标 {{ currentLevel.targetScore }}</span>
      </div>

      <!-- 护盾状态 HUD：左上 -->
      <div v-if="showHUD && isShielded" class="shield-hud">
        <span class="shield-icon">🛡</span>
        <span class="shield-label">护盾</span>
      </div>

      <!-- 道具飘字：中间偏上 -->
      <TransitionGroup name="float" tag="div" class="float-layer">
        <div
          v-for="ft in floatTexts"
          :key="ft.id"
          class="float-text"
          :class="'float-' + ft.type"
        >
          {{ ft.text }}
        </div>
      </TransitionGroup>

      <!-- 移动端虚拟按钮：下蹲 + 冲刺 + 跳跃（playing 时显示） -->
      <div v-if="showHUD" class="mobile-virtual">
        <!-- 左侧：下蹲 -->
        <button
          class="virt-btn virt-crouch"
          @touchstart.prevent="gameCanvasRef?.crouch(true)"
          @touchend.prevent="gameCanvasRef?.crouch(false)"
          @touchcancel.prevent="gameCanvasRef?.crouch(false)"
          @mousedown="gameCanvasRef?.crouch(true)"
          @mouseup="gameCanvasRef?.crouch(false)"
          @mouseleave="gameCanvasRef?.crouch(false)"
        >
          ↓
        </button>
        <!-- 右侧：冲刺 + 跳跃 -->
        <div class="virt-right-group">
          <button
            class="virt-btn virt-dash"
            @touchstart.prevent="gameCanvasRef?.dash()"
            @mousedown="gameCanvasRef?.dash()"
          >
            ⚡
          </button>
          <button
            class="virt-btn virt-jump"
            @touchstart.prevent="handleJump()"
            @mousedown="handleJump()"
          >
            ↑
          </button>
        </div>
      </div>

      <!-- 蒙层层叠 -->
      <StartScreen
        v-if="showStart"
        :sfx-enabled="sfxEnabled"
        @start="handleStart"
        @toggle-sfx="toggleSfx"
      />
      <LevelTransition
        v-if="showTransition"
        :level="transitionLevel"
        :index="transitionLevelIndex"
        :total="LEVELS.length"
        :manual="isIntroTransition"
        @start="handleBeginPlay"
      />
      <ScoreHUD v-if="showHUD" :score="score" />
      <PauseScreen
        v-if="showPaused"
        @resume="handleResume"
        @restart="handleRestart"
        @menu="handleBackToMenu"
      />
      <!-- 继续游戏倒计时：暂停蒙层消失，画面冻结，数字倒数让玩家准备 -->
      <div v-if="showResumeCountdown" class="resume-countdown" @click.stop>
        <div class="count-num">{{ resumeCountdown }}</div>
      </div>
      <GameOverScreen
        v-if="showOver"
        :score="score"
        :best="best"
        @restart="handleRestart"
        @menu="handleBackToMenu"
      />
      <VictoryScreen
        v-if="showVictory"
        :best="best"
        @restart="handleRestart"
        @menu="handleBackToMenu"
      />
    </div>
  </div>
</template>

<style scoped>
.app {
  width: 100vw;
  height: 100dvh;
  overflow: hidden;
  /* wrapper 背景就是天空色 —— 游戏区外的外围会透出此色 */
  background: #87ceeb;
}

.game-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  /* canvas 的 CSS 尺寸和 wrapper 一样，canvas 内部像素 900×300
     靠 object-fit: contain 自动等比缩放居中，外围透出 app 的天空色 */
  cursor: pointer;
  touch-action: manipulation;
  user-select: none;
}

/* 右下角键盘操作提示（playing / paused 时显示） */
.hint-corner {
  position: absolute;
  bottom: 8px;
  right: 10px;
  z-index: 10;
  display: flex;
  gap: 10px;
  padding: 5px 10px;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(4px);
  border-radius: 14px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.75);
  pointer-events: none;
  line-height: 1;
  white-space: nowrap;
}
.hint-corner span {
  padding: 2px 0;
}
/* 桌面显示，移动端隐藏（有虚拟按钮） */
@media (pointer: coarse) {
  .hint-corner {
    display: none;
  }
}

/* ===== 暂停后继续游戏倒计时 ===== */
.resume-countdown {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  /* 半透明蒙层让数字更醒目，但不挡背后画面 */
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(2px);
}

.resume-countdown .count-num {
  font-size: 160px;
  font-weight: 900;
  line-height: 1;
  color: #fff;
  text-shadow:
    0 0 24px rgba(0, 0, 0, 0.6),
    4px 4px 0 rgba(0, 0, 0, 0.45);
  animation: pop 1s ease-in-out infinite;
}

@keyframes pop {
  0% {
    transform: scale(0.6);
    opacity: 0.2;
  }
  20% {
    transform: scale(1.15);
    opacity: 1;
  }
  80% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0.9);
    opacity: 0.8;
  }
}

/* ===== 竖屏自动横屏：CSS 旋转 90° 兜底（iOS 等不支持方向锁定的浏览器） ===== */
.app-rotated {
  position: fixed;
  top: 0;
  left: 0;
  width: 100dvh;
  height: 100vw;
  transform: rotate(90deg) translateY(-100%);
  transform-origin: left top;
}

/* 控制按钮：统一圆形样式 */
.ctrl-btn {
  position: absolute;
  top: 8px;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  font-size: 16px;
  cursor: pointer;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    transform 0.1s,
    background 0.2s;
}
.ctrl-btn:hover {
  background: #fff;
  transform: scale(1.08);
}
.ctrl-btn:active {
  transform: scale(0.95);
}

.pause-btn {
  right: 8px;
  font-weight: bold;
  color: #2c3e50;
}
.levels-btn {
  right: 96px;
  font-size: 13px;
  font-weight: bold;
  color: #2c3e50;
}

/* 关卡信息条 */
.level-info {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  border-radius: 20px;
  color: #fff;
  font-size: 13px;
  z-index: 15;
  pointer-events: none;
}
.level-name {
  font-weight: bold;
}
.level-progress {
  color: #ffd700;
  font-weight: bold;
  min-width: 36px;
  text-align: right;
}
.level-target {
  opacity: 0.6;
  font-size: 11px;
}
.level-bar {
  width: 80px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
}
.level-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffd700, #ffa500);
  transition: width 0.05s linear;
}

/* LevelSelect 不覆盖 GameOver/Pause 的层级（GameOver/Pause 在后渲染会盖住它） */
/* 这里通过 z-index 让 LevelSelect 总在 StartScreen 之前 */

/* ===== 道具 HUD ===== */

.shield-hud {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(100, 200, 255, 0.3);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(100, 200, 255, 0.6);
  border-radius: 16px;
  color: #fff;
  font-size: 13px;
  font-weight: bold;
  z-index: 15;
  pointer-events: none;
}
.shield-icon {
  font-size: 16px;
}

/* 飘字层 */
.float-layer {
  position: absolute;
  left: 50%;
  top: 25%;
  transform: translateX(-50%);
  pointer-events: none;
  z-index: 16;
}
.float-text {
  font-size: 28px;
  font-weight: bold;
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.5);
  margin: 4px 0;
}
.float-coin {
  color: #f1c40f;
}
.float-shield {
  color: #5dade2;
}
.float-boost {
  color: #f39c12;
}

/* 飘字进出动画 */
.float-enter-active,
.float-leave-active {
  transition: all 0.8s ease-out;
}
.float-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.8);
}
.float-leave-to {
  opacity: 0;
  transform: translateY(-40px) scale(1.2);
}

/* ===== 移动端虚拟按钮 ===== */
.mobile-virtual {
  position: absolute;
  bottom: calc(20px + env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  width: min(88%, 720px);
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  pointer-events: none;
  z-index: 18;
}

.virt-right-group {
  display: flex;
  align-items: flex-end;
  gap: 16px;
}

.virt-btn {
  width: 56px;
  height: 56px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(6px);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
  font-size: 22px;
  cursor: pointer;
  pointer-events: auto;
  user-select: none;
  touch-action: manipulation;
  transition:
    transform 0.08s,
    background 0.15s;
}
.virt-btn:active {
  transform: scale(0.9);
  background: rgba(255, 255, 255, 0.75);
}
.virt-crouch {
  color: #2c3e50;
}
.virt-dash {
  color: #e67e22;
}
.virt-jump {
  color: #1e90ff;
}

/* 桌面隐藏虚拟按钮 */
@media (hover: hover) and (pointer: fine) {
  .mobile-virtual {
    display: none;
  }
}
</style>
