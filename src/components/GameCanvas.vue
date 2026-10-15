<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { Game } from '../game'
import type { Theme, GameState, Level, PickupType } from '../game'
import { THEMES } from '../game/utils'

const props = defineProps<{
  theme?: Theme
}>()

const emit = defineEmits<{
  (e: 'score', v: number): void
  (e: 'state', v: GameState): void
  (e: 'gameover', v: number): void
  (e: 'levelchange', index: number, level: Level): void
  (e: 'victory'): void
  (e: 'pickup', type: PickupType): void
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let game: Game | null = null
let resizeObserver: ResizeObserver | null = null

/** 根据关卡 theme 同步 canvas CSS 背景，与游戏内天空色无缝衔接 */
function applyThemeBg(theme: Theme): void {
  if (canvasRef.value) {
    canvasRef.value.style.background = THEMES[theme].skyTop
  }
}

watch(
  () => props.theme,
  (t) => {
    if (t) applyThemeBg(t)
  },
  { immediate: true }
)

onMounted(() => {
  if (!canvasRef.value) return

  // 构造 Game：逻辑像素永远 900×300
  game = new Game(canvasRef.value, {
    onScoreChange: (s) => emit('score', s),
    onStateChange: (s) => emit('state', s),
    onGameOver: (s) => emit('gameover', s),
    onLevelChange: (idx, lv) => emit('levelchange', idx, lv),
    onVictory: () => emit('victory'),
    onPickup: (t) => emit('pickup', t),
  })
  game.mount()
  // 注意：不再用 ResizeObserver 改 canvas.width/height
  // canvas 逻辑像素固定 900×300，CSS 用 object-fit: contain 负责视觉缩放
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  game?.unmount()
  game = null
})

function start() {
  game?.start()
}
function pause() {
  game?.pause()
}
function resume() {
  game?.resume()
}
function restart() {
  game?.restart()
}
function returnToMenu() {
  game?.returnToMenu()
}
function jump() {
  game?.jump()
}
function crouch(on: boolean) {
  game?.crouch(on)
}
function dash() {
  game?.dash()
}
function gotoLevel(index: number) {
  game?.gotoLevel(index)
}
function beginPlay() {
  game?.beginPlay()
}
function isIntroPending(): boolean {
  return game?.isIntroPending() ?? false
}
function setSfxEnabled(v: boolean) {
  game?.setSfxEnabled(v)
}
function isSfxEnabled(): boolean {
  return game?.isSfxEnabled() ?? true
}
function resumeLoop() {
  game?.resumeLoop()
}
function getLevelIndex(): number {
  return game?.getLevelIndex() ?? 0
}
function getCurrentLevel(): Level | null {
  return game?.getCurrentLevel() ?? null
}
function getLevelProgress(): {
  current: number
  target: number
  ratio: number
} {
  return game?.getLevelProgress() ?? { current: 0, target: 100, ratio: 0 }
}

defineExpose({
  start,
  beginPlay,
  isIntroPending,
  pause,
  resume,
  restart,
  returnToMenu,
  jump,
  crouch,
  dash,
  gotoLevel,
  setSfxEnabled,
  isSfxEnabled,
  resumeLoop,
  getLevelIndex,
  getCurrentLevel,
  getLevelProgress,
})
</script>

<template>
  <canvas ref="canvasRef" class="game-canvas" />
</template>

<style scoped>
.game-canvas {
  position: absolute;
  inset: 0;
  /* CSS 撑满 wrapper，但内部逻辑像素永远是 config 的 900×300
     object-fit: contain 让浏览器自动等比缩放居中，不变形、不溢出 */
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  display: block;
  image-rendering: auto;
}
</style>
