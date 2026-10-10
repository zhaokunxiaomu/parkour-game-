<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import GameCanvas from './components/GameCanvas.vue'
import StartScreen from './components/StartScreen.vue'
import GameOverScreen from './components/GameOverScreen.vue'
import PauseScreen from './components/PauseScreen.vue'
import LevelTransition from './components/LevelTransition.vue'
import VictoryScreen from './components/VictoryScreen.vue'
import LevelSelect from './components/LevelSelect.vue'
import ScoreHUD from './components/ScoreHUD.vue'
import type { GameState, Level, PickupType } from './game'
import { LEVELS } from './game'

const gameCanvasRef = ref<InstanceType<typeof GameCanvas> | null>(null)
const state = ref<GameState>('menu')
const score = ref(0)
const best = ref(0)

const levelIndex = ref(0)
const currentLevel = ref<Level>(LEVELS[0])
const progressRatio = ref(0) // 关卡进度 0~1

const showLevelSelect = ref(false) // 主菜单显示关卡选择
const sfxEnabled = ref(true)

/** 道具状态 */
const floatTexts = ref<{ id: number; type: PickupType; text: string }[]>([])
let floatId = 0
const isShielded = ref(false) // 是否激活护盾（UI 显示用）

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

onMounted(() => {
  const saved = Number(localStorage.getItem(BEST_KEY) || 0)
  if (!Number.isNaN(saved)) best.value = saved
  sfxEnabled.value = localStorage.getItem(SFX_KEY) !== '0'
  gameCanvasRef.value?.setSfxEnabled(sfxEnabled.value)

  window.addEventListener('keydown', onKey)
  window.addEventListener('keyup', onKeyUp)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('keyup', onKeyUp)
  stopProgressTicker()
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
    else if (state.value === 'paused') handleResume()
    else if (
      state.value === 'menu' ||
      state.value === 'over' ||
      state.value === 'victory'
    )
      handleStart()
  } else if (e.code === 'KeyP' || e.code === 'Escape') {
    e.preventDefault()
    if (state.value === 'playing') handlePause()
    else if (state.value === 'paused') handleResume()
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
  gameCanvasRef.value?.pause()
}
function handleResume() {
  gameCanvasRef.value?.resume()
}
function handleGotoLevel(i: number) {
  showLevelSelect.value = false
  gameCanvasRef.value?.gotoLevel(i)
}
function handleBackToMenu() {
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
  showLevelSelect.value = false
  gameCanvasRef.value?.start()
}
function handleRestart() {
  isShielded.value = false
  showLevelSelect.value = false
  gameCanvasRef.value?.restart()
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
const showPaused = computed(() => state.value === 'paused')
const showTransition = computed(() => state.value === 'transition')
const showVictory = computed(() => state.value === 'victory')
const showHUD = computed(() => state.value === 'playing')
const showPauseBtn = computed(() => state.value === 'playing')
const showLevelInfo = computed(
  () =>
    state.value === 'playing' ||
    state.value === 'paused' ||
    state.value === 'transition'
)
const showLevelSelectBtn = computed(() => state.value === 'menu')

function onCanvasClick() {
  if (state.value === 'playing') handleJump()
}
</script>

<template>
  <div class="app">
    <header class="header">
      <h1 class="app-title">跑酷大冒险</h1>
      <p class="app-sub">空格/↑=跳跃　↓/S=下蹲　Shift=冲刺　P/Esc=暂停</p>
    </header>

    <div class="game-wrapper">
      <GameCanvas
        ref="gameCanvasRef"
        @click="onCanvasClick"
        @score="onScore"
        @state="onState"
        @gameover="onGameOver"
        @levelchange="onLevelChange"
        @victory="onVictory"
        @pickup="onPickup"
      />

      <!-- 右上角控制：暂停 / 音效 -->
      <button
        v-if="showPauseBtn"
        class="ctrl-btn pause-btn"
        @click.stop="togglePause"
        title="暂停 (P)"
      >
        ‖
      </button>
      <button
        v-if="state !== 'menu'"
        class="ctrl-btn sfx-btn"
        @click.stop="toggleSfx"
        :title="sfxEnabled ? '关闭音效' : '开启音效'"
      >
        {{ sfxEnabled ? '🔊' : '🔇' }}
      </button>
      <button
        v-if="showLevelSelectBtn"
        class="ctrl-btn levels-btn"
        @click.stop="showLevelSelect = true"
      >
        关卡
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

      <!-- 移动端虚拟按钮：下蹲 + 冲刺（playing 时显示） -->
      <div v-if="showHUD" class="mobile-virtual">
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
        <button
          class="virt-btn virt-dash"
          @touchstart.prevent="gameCanvasRef?.dash()"
          @mousedown="gameCanvasRef?.dash()"
        >
          ⚡
        </button>
      </div>

      <!-- 蒙层层叠：transition 在最上，因为自动消失；LevelSelect 由按钮触发 -->
      <Transition name="fade">
        <LevelSelect
          v-if="showStart && showLevelSelect"
          @goto="handleGotoLevel"
        />
      </Transition>
      <StartScreen v-if="showStart && !showLevelSelect" @start="handleStart" />
      <LevelTransition
        v-if="showTransition"
        :level="currentLevel"
        :index="levelIndex"
        :total="LEVELS.length"
      />
      <ScoreHUD v-if="showHUD" :score="score" />
      <PauseScreen
        v-if="showPaused"
        @resume="handleResume"
        @restart="handleRestart"
        @menu="handleBackToMenu"
      />
      <GameOverScreen
        v-if="showOver"
        :score="score"
        :best="best"
        @restart="handleRestart"
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
  height: 100dvh;
  display: flex;
  flex-direction: column;
  padding: clamp(8px, 2vh, 24px) clamp(8px, 2vw, 24px);
  box-sizing: border-box;
  overflow: hidden;
}

.header {
  text-align: center;
  flex-shrink: 0;
}
.app-title {
  margin: 0 0 2px;
  font-size: clamp(18px, 3.5vw, 32px);
  letter-spacing: 2px;
  color: #2c3e50;
}
.app-sub {
  margin: 0;
  font-size: clamp(11px, 1.8vw, 15px);
  color: #7f8c8d;
}

.game-wrapper {
  position: relative;
  margin: clamp(8px, 2vh, 24px) auto 0;
  width: 100%;
  aspect-ratio: 3 / 1;
  max-height: calc(100dvh - clamp(60px, 10vh, 100px));
  max-width: calc((100dvh - clamp(60px, 10vh, 100px)) * 3);
  cursor: pointer;
  touch-action: manipulation;
  user-select: none;
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
.sfx-btn {
  right: 52px;
  font-size: 18px;
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
  bottom: 12px;
  left: 12px;
  right: 12px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  pointer-events: none;
  z-index: 18;
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

/* 桌面隐藏虚拟按钮 */
@media (hover: hover) and (pointer: fine) {
  .mobile-virtual {
    display: none;
  }
}
</style>
