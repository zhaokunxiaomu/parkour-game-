<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { Game } from '../game'
import type { GameState, Level, PickupType } from '../game'

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

onMounted(() => {
  if (!canvasRef.value) return
  game = new Game(canvasRef.value, {
    onScoreChange: (s) => emit('score', s),
    onStateChange: (s) => emit('state', s),
    onGameOver: (s) => emit('gameover', s),
    onLevelChange: (idx, lv) => emit('levelchange', idx, lv),
    onVictory: () => emit('victory'),
    onPickup: (t) => emit('pickup', t),
  })
  game.mount()
})

onBeforeUnmount(() => {
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
function setSfxEnabled(v: boolean) {
  game?.setSfxEnabled(v)
}
function isSfxEnabled(): boolean {
  return game?.isSfxEnabled() ?? true
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
  pause,
  resume,
  restart,
  jump,
  crouch,
  dash,
  gotoLevel,
  setSfxEnabled,
  isSfxEnabled,
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
  width: 100%;
  height: 100%;
  display: block;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  background: #87ceeb;
  image-rendering: auto;
}
</style>
