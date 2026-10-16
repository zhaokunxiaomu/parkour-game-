<script setup lang="ts">
import type { FloatText } from '../composables/types'

defineProps<{ items: FloatText[] }>()
</script>

<template>
  <!-- 道具飘字：中间偏上 -->
  <TransitionGroup name="float" tag="div" class="float-layer">
    <div
      v-for="ft in items"
      :key="ft.id"
      class="float-text"
      :class="'float-' + ft.type"
    >
      {{ ft.text }}
    </div>
  </TransitionGroup>
</template>

<style scoped>
.float-layer {
  position: absolute;
  left: 50%;
  top: 25%;
  transform: translateX(-50%);
  pointer-events: none;
  z-index: 16;
}
.float-text {
  font-size: 28px;
  font-weight: bold;
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.5);
  margin: 4px 0;
}
.float-coin {
  color: #f1c40f;
}
.float-shield {
  color: #5dade2;
}
.float-boost {
  color: #f39c12;
}

/* 飘字进出动画 */
.float-enter-active,
.float-leave-active {
  transition: all 0.8s ease-out;
}
.float-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.8);
}
.float-leave-to {
  opacity: 0;
  transform: translateY(-40px) scale(1.2);
}
</style>
