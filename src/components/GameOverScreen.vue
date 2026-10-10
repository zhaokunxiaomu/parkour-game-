<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ score: number; best: number }>()
defineEmits<{ (e: 'restart'): void }>()

const isNewBest = computed(() => props.score >= props.best && props.score > 0)
</script>

<template>
  <div class="overlay" @click.stop>
    <div class="panel">
      <h1 class="title">Game Over</h1>
      <div class="scores">
        <div class="row">
          <span class="label">本局</span>
          <span class="value">{{ score }}</span>
        </div>
        <div class="row">
          <span class="label">最高</span>
          <span class="value best">{{ best }}</span>
        </div>
        <div v-if="isNewBest" class="new-best">新纪录！</div>
      </div>
      <button class="btn" @click="$emit('restart')">再来一局</button>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(3px);
}
.panel {
  text-align: center;
  color: #fff;
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.5);
}
.title {
  font-size: 40px;
  margin: 0 0 20px;
  letter-spacing: 3px;
}
.scores {
  margin-bottom: 28px;
}
.row {
  display: flex;
  justify-content: center;
  gap: 16px;
  font-size: 20px;
  margin: 6px 0;
}
.row .label { opacity: 0.7; }
.row .value { font-weight: bold; min-width: 60px; text-align: right; }
.row .value.best { color: #FFD700; }
.new-best {
  color: #FFD700;
  font-size: 16px;
  margin-top: 10px;
  animation: pop 0.6s ease-out;
}
@keyframes pop {
  0% { transform: scale(0.5); opacity: 0; }
  60% { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); }
}
.btn {
  padding: 12px 36px;
  font-size: 18px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #2ed573, #1e90ff);
  color: #fff;
  cursor: pointer;
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.25);
  transition: transform 0.08s;
}
.btn:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.25);
}
</style>
