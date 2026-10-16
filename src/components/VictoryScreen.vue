<script setup lang="ts">
import SvgIcon from './SvgIcon.vue'

defineEmits<{ (e: 'restart'): void; (e: 'menu'): void }>()
defineProps<{ best: number }>()
</script>

<template>
  <div
    class="overlay absolute inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.7)] backdrop-blur-[6px]"
    @click.stop
  >
    <div class="text-center text-white">
      <div class="trophy mb-3 flex justify-center text-[#FFD700]">
        <SvgIcon name="star" :size="64" />
      </div>
      <h1
        class="m-0 mb-2 bg-linear-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-[44px] tracking-[4px] text-transparent"
      >
        通关成功！
      </h1>
      <p class="m-0 mb-5 text-[15px] opacity-85">
        你征服了所有关卡，成为跑酷之王！
      </p>
      <div class="mb-6">
        <div class="my-[6px] flex justify-center gap-3 text-[18px]">
          <span class="opacity-70">最终最高分</span>
          <span class="min-w-[80px] text-right font-bold text-[#FFD700]">
            {{ best }}
          </span>
        </div>
      </div>
      <div class="flex justify-center gap-3">
        <button
          class="rounded-lg border-none bg-linear-to-br from-[#2ed573] to-[#1e90ff] px-7 py-[10px] text-[16px] text-white shadow-[0_4px_0_rgba(0,0,0,0.3)] transition-transform duration-[0.08s] cursor-pointer active:translate-y-[2px] active:shadow-[0_2px_0_rgba(0,0,0,0.3)]"
          @click="$emit('restart')"
        >
          再玩一次
        </button>
        <button
          class="rounded-lg border border-[rgba(255,255,255,0.3)] bg-[rgba(255,255,255,0.15)] px-7 py-[10px] text-[16px] text-white shadow-[0_4px_0_rgba(0,0,0,0.3)] transition-transform duration-[0.08s] cursor-pointer active:translate-y-[2px] active:shadow-[0_2px_0_rgba(0,0,0,0.3)]"
          @click="$emit('menu')"
        >
          返回主菜单
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  animation: fadeIn 0.5s ease-out;
}
.trophy {
  animation: bounce 1s ease-out;
  /* svg 图标用投影模拟原文字 text-shadow 的金色光晕 */
  filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.6));
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes bounce {
  0% {
    transform: scale(0) rotate(-20deg);
  }
  60% {
    transform: scale(1.2) rotate(10deg);
  }
  100% {
    transform: scale(1) rotate(0);
  }
}
</style>
