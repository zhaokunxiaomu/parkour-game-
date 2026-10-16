<script setup lang="ts">
import SvgIcon from './SvgIcon.vue'

defineProps<{
  sfxEnabled: boolean
}>()

defineEmits<{
  (e: 'start'): void
  (e: 'toggle-sfx'): void
  (e: 'help'): void
}>()

const sfxIconBase =
  'absolute top-[10px] flex h-[34px] w-[34px] items-center justify-center rounded-full border-none p-0 text-[#2c3e50] shadow-none transition-transform duration-[0.08s] cursor-pointer hover:scale-[1.08] active:scale-[0.95]'
</script>

<template>
  <div
    class="absolute inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.35)] backdrop-blur-[2px]"
    @click.stop
  >
    <button
      :class="[sfxIconBase, 'right-[52px] bg-[rgba(255,255,255,0.9)]']"
      @click.stop="$emit('help')"
      title="玩法说明"
    >
      <SvgIcon name="help" :size="20" />
    </button>
    <button
      :class="[
        sfxIconBase,
        'right-[10px]',
        sfxEnabled
          ? 'bg-[rgba(255,255,255,0.9)]'
          : 'bg-[rgba(255,255,255,0.45)] text-[rgba(44,62,80,0.7)]',
      ]"
      @click.stop="$emit('toggle-sfx')"
      :title="sfxEnabled ? '关闭音效' : '开启音效'"
    >
      <SvgIcon :name="sfxEnabled ? 'volume-up' : 'volume-mute'" :size="20" />
    </button>
    <div class="text-center text-white text-shadow-[2px_2px_0_rgba(0,0,0,0.5)]">
      <img
        src="../assets/logo.svg"
        class="mb-[10px] h-[110px] w-[110px] rounded-[18px] border-[3px] border-[rgba(255,255,255,0.85)] object-cover shadow-[0_4px_14px_rgba(0,0,0,0.35)]"
        :draggable="false"
        alt="跑酷大冒险"
      />
      <h1 class="m-0 mb-3 text-[36px] tracking-[4px]">跑酷大冒险</h1>
      <p class="m-0 mb-7 text-[16px] opacity-85">
        跳跃躲障碍 · 下蹲钻门 · 冲刺吃金币，连闯 4 大关卡！
      </p>
      <button
        class="rounded-lg border-none bg-linear-to-br from-[#ff6b6b] to-[#ee5a24] px-9 py-3 text-[18px] text-white shadow-[0_4px_0_rgba(0,0,0,0.25)] transition-transform duration-[0.08s] cursor-pointer active:translate-y-[2px] active:shadow-[0_2px_0_rgba(0,0,0,0.25)]"
        @click="$emit('start')"
      >
        开始游戏
      </button>
    </div>
  </div>
</template>
