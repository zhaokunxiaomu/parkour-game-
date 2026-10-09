<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { Game } from '../game'
import type { GameState } from '../game'

const emit = defineEmits<{
  (e: 'score', v: number): void
  (e: 'state', v: GameState): void
  (e: 'gameover', v: number): void
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let game: Game | null = null

onMounted(() => {
  if (!canvasRef.value) return
  game = new Game(
    canvasRef.value,
    {
      onScoreChange: s => emit('score', s),
      onStateChange: s => emit('state', s),
      onGameOver: s => emit('gameover', s),
    },
  )
  game.mount()
})

onBeforeUnmount(() => {
  game?.unmount()
  game = null
})

/** 外部调用：开始游戏 */
function start() {
  game?.start()
}

/** 外部调用：触发跳跃 */
function jump() {
  game?.jump()
}

defineExpose({ start, jump })
</script>

<template>
  <canvas ref="canvasRef" class="game-canvas" />
</template>

<style scoped>
.game-canvas {
  display: block;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  background: #87CEEB;
  max-width: 100%;
  height: auto;
}
</style>
