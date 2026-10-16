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
  <div
    class="overlay absolute inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.6)] backdrop-blur-[4px]"
  >
    <div class="text-center text-white text-shadow-[2px_2px_0_rgba(0,0,0,0.5)]">
      <p class="m-0 mb-[6px] text-[14px] tracking-[3px] text-[#ffd700]">
        第 {{ index + 1 }} / {{ total }} 关
      </p>
      <h1 class="m-0 mb-3 text-[48px] tracking-[6px]">{{ level.name }}</h1>
      <p class="m-0 mb-[6px] text-[16px] opacity-85">{{ level.description }}</p>
      <p class="m-0 mb-6 text-[14px] opacity-70">
        目标得分：{{ level.targetScore }}
      </p>

      <!-- 第一关：手动开始按钮 -->
      <template v-if="manual">
        <button
          class="mb-[14px] rounded-lg border-none bg-linear-to-br from-[#ffd700] to-[#ffa500] px-10 py-3 text-[18px] font-bold text-[#2c3e50] text-shadow-none shadow-[0_4px_0_rgba(0,0,0,0.25)] transition-transform duration-[0.08s] cursor-pointer active:translate-y-[2px] active:shadow-[0_2px_0_rgba(0,0,0,0.25)]"
          @click="emit('start')"
        >
          开始
        </button>
      </template>

      <!-- 后续关卡：自动倒计时进度条 -->
      <template v-else>
        <div
          class="mx-auto mb-5 h-[6px] w-[220px] overflow-hidden rounded-[3px] bg-[rgba(255,255,255,0.2)]"
        >
          <div
            class="h-full bg-linear-to-r from-[#ffd700] to-[#ffa500] transition-[width] duration-[0.05s] ease-linear"
            :style="{ width: progress * 100 + '%' }"
          />
        </div>
        <p class="m-0 text-[14px] opacity-60">准备好 ——</p>
      </template>
    </div>
  </div>
</template>

<style scoped>
.overlay {
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
</style>
