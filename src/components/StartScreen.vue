<script setup lang="ts">
defineEmits<{ (e: 'start'): void }>()
</script>

<template>
  <div class="overlay" @click.stop>
    <div class="panel">
      <h1 class="title">跑酷大冒险</h1>
      <p class="tip">点击屏幕 / 空格 / ↑ 跳跃</p>
      <button class="btn" @click="$emit('start')">开始游戏</button>
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
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(2px);
}
.panel {
  text-align: center;
  color: #fff;
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.5);
}
.title {
  font-size: 42px;
  margin: 0 0 12px;
  letter-spacing: 4px;
}
.tip {
  font-size: 16px;
  margin: 0 0 28px;
  opacity: 0.85;
}
.btn {
  padding: 12px 36px;
  font-size: 18px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
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
