<script setup lang="ts">
defineEmits<{
  (e: 'resume'): void
  (e: 'restart'): void
  (e: 'menu'): void
}>()

// 三种按钮共用的基础样式（背景/边框色由各自变体单独指定，避免工具类冲突）
const btnBase =
  'min-w-[160px] px-9 py-3 text-[17px] rounded-lg border-2 cursor-pointer shadow-[0_4px_0_rgba(0,0,0,0.25)] transition-[transform,background] duration-[0.08s,0.2s] active:translate-y-[2px] active:shadow-[0_2px_0_rgba(0,0,0,0.25)]'
</script>

<template>
  <div
    class="absolute inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.55)] backdrop-blur-[4px]"
    @click.stop
  >
    <div class="text-center text-white text-shadow-[2px_2px_0_rgba(0,0,0,0.5)]">
      <h1 class="m-0 mb-7 text-[42px] tracking-[4px]">已暂停</h1>
      <div class="flex flex-col items-center gap-3">
        <button
          :class="[
            btnBase,
            'bg-linear-to-br from-[#2ed573] to-[#1e90ff] border-transparent text-white hover:brightness-110',
          ]"
          @click="$emit('resume')"
        >
          继续
        </button>
        <button
          :class="[
            btnBase,
            'bg-[rgba(255,255,255,0.15)] border-[rgba(255,255,255,0.4)] text-white hover:bg-[rgba(255,255,255,0.28)]',
          ]"
          @click="$emit('restart')"
        >
          重新开始
        </button>
        <button
          :class="[
            btnBase,
            'bg-transparent border-[rgba(255,255,255,0.35)] text-[rgba(255,255,255,0.85)] hover:bg-[rgba(255,255,255,0.1)]',
          ]"
          @click="$emit('menu')"
        >
          返回主菜单
        </button>
      </div>
    </div>
  </div>
</template>
