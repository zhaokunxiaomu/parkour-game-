<script setup lang="ts">
defineProps<{ score: number }>()
</script>

<template>
  <div class="score-hud">
    <span class="label">分数</span>
    <span class="value">{{ score }}</span>
  </div>
</template>

<style scoped>
.score-hud {
  position: absolute;
  top: 16px;
  left: 20px;
  font-family: 'Courier New', monospace;
  color: #333;
  text-shadow: 1px 1px 0 rgba(255, 255, 255, 0.6);
  user-select: none;
}
.score-hud .label {
  font-size: 14px;
  opacity: 0.7;
  margin-right: 8px;
}
.score-hud .value {
  font-size: 28px;
  font-weight: bold;
}
</style>
