<script setup lang="ts">
defineProps<{ count: number | null }>()
</script>

<template>
  <!-- 继续游戏倒计时：暂停蒙层消失，画面冻结，数字倒数让玩家准备 -->
  <div class="resume-countdown" @click.stop>
    <div class="count-num">{{ count }}</div>
  </div>
</template>

<style scoped>
.resume-countdown {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  /* 半透明蒙层让数字更醒目，但不挡背后画面 */
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(2px);
}

.resume-countdown .count-num {
  font-size: 160px;
  font-weight: 900;
  line-height: 1;
  color: #fff;
  text-shadow:
    0 0 24px rgba(0, 0, 0, 0.6),
    4px 4px 0 rgba(0, 0, 0, 0.45);
  animation: pop 1s ease-in-out infinite;
}

@keyframes pop {
  0% {
    transform: scale(0.6);
    opacity: 0.2;
  }
  20% {
    transform: scale(1.15);
    opacity: 1;
  }
  80% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0.9);
    opacity: 0.8;
  }
}
</style>
