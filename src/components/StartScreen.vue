<script setup lang="ts">
defineProps<{
  sfxEnabled: boolean
}>()

defineEmits<{
  (e: 'start'): void
  (e: 'toggle-sfx'): void
}>()
</script>

<template>
  <div class="overlay" @click.stop>
    <button
      class="sfx-icon"
      :class="{ off: !sfxEnabled }"
      @click.stop="$emit('toggle-sfx')"
      :title="sfxEnabled ? '关闭音效' : '开启音效'"
    >
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path d="M3 9v6h4l5 5V4L7 9H3z" fill="currentColor" />
        <template v-if="sfxEnabled">
          <path
            d="M16.5 8.5a4.5 4.5 0 0 1 0 7"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </template>
        <template v-else>
          <line
            x1="17"
            y1="9.5"
            x2="22"
            y2="14.5"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
          <line
            x1="22"
            y1="9.5"
            x2="17"
            y2="14.5"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </template>
      </svg>
    </button>
    <div class="panel">
      <img
        src="../assets/logo.png"
        class="logo-img"
        :draggable="false"
        alt="跑酷大冒险"
      />
      <h1 class="title">跑酷大冒险</h1>
      <p class="tip">跳跃躲障碍 · 下蹲钻门 · 冲刺吃金币，连闯 4 大关卡！</p>
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
.logo-img {
  width: 110px;
  height: 110px;
  object-fit: cover;
  border-radius: 18px;
  margin: 0 0 10px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
  border: 3px solid rgba(255, 255, 255, 0.85);
}
.title {
  font-size: 36px;
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

.sfx-icon {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  color: #2c3e50;
  cursor: pointer;
  transition: transform 0.08s;
}
.sfx-icon:hover {
  transform: scale(1.08);
}
.sfx-icon:active {
  transform: scale(0.95);
}
.sfx-icon.off {
  background: rgba(255, 255, 255, 0.45);
  color: rgba(44, 62, 80, 0.7);
}
</style>
