<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import GameCanvas from './components/GameCanvas.vue'
import StartScreen from './components/StartScreen.vue'
import GameOverScreen from './components/GameOverScreen.vue'
import ScoreHUD from './components/ScoreHUD.vue'
import type { GameState } from './game'

const gameCanvasRef = ref<InstanceType<typeof GameCanvas> | null>(null)
const state = ref<GameState>('menu')
const score = ref(0)
const best = ref(0)

const BEST_KEY = 'parkour-best-score'

onMounted(() => {
  const saved = Number(localStorage.getItem(BEST_KEY) || 0)
  if (!Number.isNaN(saved)) best.value = saved

  // 全局输入：键盘 + 点击
  window.addEventListener('keydown', onKey)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
})

function onKey(e: KeyboardEvent) {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    e.preventDefault()
    handleJump()
  }
}

function handleJump() {
  gameCanvasRef.value?.jump()
}

function handleStart() {
  gameCanvasRef.value?.start()
}

function handleRestart() {
  gameCanvasRef.value?.start()
}

function onScore(s: number) {
  score.value = s
}

function onState(s: GameState) {
  state.value = s
}

function onGameOver(s: number) {
  if (s > best.value) {
    best.value = s
    localStorage.setItem(BEST_KEY, String(s))
  }
}

const showStart = computed(() => state.value === 'menu')
const showOver = computed(() => state.value === 'over')
const showHUD = computed(() => state.value === 'playing')

/** 点击画布也能跳（Vue 模板中 @click 直接调用 handleJump） */
function onCanvasClick() {
  handleJump()
}
</script>

<template>
  <div class="app">
    <h1 class="app-title">🏃 跑酷大冒险</h1>
    <p class="app-sub">空格 / ↑ / 点击 = 跳跃　　最高分：{{ best }}</p>

    <div class="game-wrapper" @click="onCanvasClick">
      <GameCanvas
        ref="gameCanvasRef"
        @score="onScore"
        @state="onState"
        @gameover="onGameOver"
      />
      <ScoreHUD v-if="showHUD" :score="score" />
      <StartScreen v-if="showStart" @start="handleStart" />
      <GameOverScreen
        v-if="showOver"
        :score="score"
        :best="best"
        @restart="handleRestart"
      />
    </div>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  box-sizing: border-box;
}
.app-title {
  margin: 0 0 4px;
  font-size: 28px;
  letter-spacing: 2px;
  color: #2c3e50;
}
.app-sub {
  margin: 0 0 24px;
  font-size: 14px;
  color: #7f8c8d;
}
.game-wrapper {
  position: relative;
  width: 900px;
  max-width: 100%;
  cursor: pointer;
  touch-action: manipulation;
  user-select: none;
}
</style>
