<script setup lang="ts">
import type { Level } from '../game'

defineProps<{ level: Level; ratio: number }>()
</script>

<template>
  <div class="level-info">
    <span class="level-name">{{ level.name }}</span>
    <span class="level-progress">{{ Math.floor(ratio * 100) }}%</span>
    <div class="level-bar">
      <div class="level-fill" :style="{ width: ratio * 100 + '%' }" />
    </div>
    <span class="level-target">目标 {{ level.targetScore }}</span>
  </div>
</template>

<style scoped>
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
</style>
