<script setup lang="ts">
defineProps<{ score: number }>()
</script>

<template>
  <div
    class="absolute top-4 left-5 font-['Courier_New',monospace] text-[#333] text-shadow-[1px_1px_0_rgba(255,255,255,0.6)] select-none"
  >
    <span class="text-[14px] opacity-70 mr-2">分数</span>
    <span class="text-[28px] font-bold">{{ score }}</span>
  </div>
</template>
