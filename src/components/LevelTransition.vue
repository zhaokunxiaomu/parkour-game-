<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { Level } from '../game'

const props = defineProps<{
  level: Level
  index: number
  total: number
  manual?: boolean // 第一关提示：无进度条，点按钮开始
}>()

const emit = defineEmits<{ (e: 'start'): void }>()

const progress = ref(0)
onMounted(() => {
  if (props.manual) return // 手动模式不跑倒计时
  const start = performance.now()
  const dur = 3500 // 和引擎 TRANSITION_FRAMES=240（≈4s）对齐，略短让进度先填满
  const tick = (now: number) => {
    progress.value = Math.min(1, (now - start) / dur)
    if (progress.value < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
})
</script>

<template>
  <div class="overlay">
    <div class="panel">
      <p class="chapter">第 {{ index + 1 }} / {{ total }} 关</p>
      <h1 class="title">{{ level.name }}</h1>
      <p class="desc">{{ level.description }}</p>
      <p class="target">目标得分：{{ level.targetScore }}</p>

      <!-- 第一关：手动开始按钮 -->
      <template v-if="manual">
        <button class="btn" @click="emit('start')">开始</button>
      </template>

      <!-- 后续关卡：自动倒计时进度条 -->
      <template v-else>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progress * 100 + '%' }" />
        </div>
        <p class="hint">准备好 ——</p>
      </template>
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
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.panel {
  text-align: center;
  color: #fff;
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.5);
}

.chapter {
  margin: 0 0 6px;
  font-size: 14px;
  letter-spacing: 3px;
  color: #ffd700;
}

.title {
  margin: 0 0 12px;
  font-size: 48px;
  letter-spacing: 6px;
}

.desc {
  margin: 0 0 6px;
  font-size: 16px;
  opacity: 0.85;
}

.target {
  margin: 0 0 24px;
  font-size: 14px;
  opacity: 0.7;
}

.btn {
  padding: 12px 40px;
  margin-bottom: 14px;
  font-size: 18px;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #ffd700, #ffa500);
  color: #2c3e50;
  cursor: pointer;
  text-shadow: none;
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.25);
  transition: transform 0.08s;
}
.btn:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.25);
}

.progress-bar {
  width: 220px;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
  margin: 0 auto 20px;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffd700, #ffa500);
  transition: width 0.05s linear;
}

.hint {
  margin: 0;
  font-size: 14px;
  opacity: 0.6;
}
</style>
