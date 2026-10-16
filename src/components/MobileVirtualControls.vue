<script setup lang="ts">
import SvgIcon from './SvgIcon.vue'

const emit = defineEmits<{
  (e: 'crouch', on: boolean): void
  (e: 'dash'): void
  (e: 'jump'): void
}>()
</script>

<template>
  <!-- 移动端虚拟按钮：左侧下蹲+冲刺，右侧跳跃（playing 时显示） -->
  <div class="mobile-virtual">
    <!-- 左侧：下蹲 + 冲刺 -->
    <div class="virt-left-group">
      <button
        class="virt-btn virt-crouch"
        @touchstart.prevent="emit('crouch', true)"
        @touchend.prevent="emit('crouch', false)"
        @touchcancel.prevent="emit('crouch', false)"
        @mousedown="emit('crouch', true)"
        @mouseup="emit('crouch', false)"
        @mouseleave="emit('crouch', false)"
      >
        <SvgIcon name="arrow-down" :size="20" />
        <span class="virt-label">下蹲</span>
      </button>
      <button
        class="virt-btn virt-dash"
        @touchstart.prevent="emit('dash')"
        @mousedown="emit('dash')"
      >
        <SvgIcon name="dash" :size="20" />
        <span class="virt-label">冲刺</span>
      </button>
    </div>
    <!-- 右侧：跳跃 -->
    <button
      class="virt-btn virt-jump"
      @touchstart.prevent="emit('jump')"
      @mousedown="emit('jump')"
    >
      <SvgIcon name="arrow-up" :size="24" />
      <span class="virt-label">跳跃</span>
    </button>
  </div>
</template>

<style scoped>
.mobile-virtual {
  position: absolute;
  bottom: calc(14px + env(safe-area-inset-bottom));
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 0 calc(20px + env(safe-area-inset-right)) 0
    calc(20px + env(safe-area-inset-left));
  pointer-events: none;
  z-index: 18;
}

.virt-left-group {
  display: flex;
  align-items: flex-end;
  gap: 14px;
}

.virt-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  width: 62px;
  height: 62px;
  border: 1px solid rgba(255, 255, 255, 0.55);
  border-radius: 50%;
  color: #fff;
  backdrop-filter: blur(6px);
  box-shadow:
    0 4px 14px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.35);
  cursor: pointer;
  pointer-events: auto;
  user-select: none;
  touch-action: manipulation;
  transition:
    transform 0.08s,
    filter 0.15s;
}
.virt-btn:active {
  transform: scale(0.9);
  filter: brightness(1.2);
}
.virt-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2px;
  line-height: 1;
}

.virt-crouch {
  background: rgba(44, 62, 80, 0.55);
}
.virt-dash {
  background: rgba(230, 126, 34, 0.6);
}
/* 跳跃是最高频操作：加大一号，放最顺手右下角 */
.virt-jump {
  width: 84px;
  height: 84px;
  background: rgba(30, 144, 255, 0.62);
}

/* 桌面隐藏虚拟按钮 */
@media (hover: hover) and (pointer: fine) {
  .mobile-virtual {
    display: none;
  }
}
</style>
