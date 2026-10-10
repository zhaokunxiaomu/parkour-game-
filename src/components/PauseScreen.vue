<script setup lang="ts">
defineEmits<{
  (e: 'resume'): void
  (e: 'restart'): void
  (e: 'menu'): void
}>()
</script>

<template>
  <div class="overlay" @click.stop>
    <div class="panel">
      <h1 class="title">已暂停</h1>
      <div class="btns">
        <button class="btn primary" @click="$emit('resume')">继续</button>
        <button class="btn" @click="$emit('restart')">重新开始</button>
        <button class="btn ghost" @click="$emit('menu')">返回主菜单</button>
      </div>
      <p class="hint">P / Esc / 空格 = 继续</p>
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
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
}

.panel {
  text-align: center;
  color: #fff;
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.5);
}

.title {
  font-size: 42px;
  margin: 0 0 28px;
  letter-spacing: 4px;
}

.btns {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.btn {
  padding: 12px 36px;
  font-size: 17px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  cursor: pointer;
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.25);
  transition: transform 0.08s, background 0.2s;
  min-width: 160px;
}

.btn:hover {
  background: rgba(255, 255, 255, 0.28);
}

.btn:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.25);
}

.btn.primary {
  background: linear-gradient(135deg, #2ed573, #1e90ff);
  border-color: transparent;
}

.btn.primary:hover {
  filter: brightness(1.1);
}

.btn.ghost {
  background: transparent;
  border-color: rgba(255, 255, 255, 0.35);
  color: rgba(255, 255, 255, 0.85);
}

.btn.ghost:hover {
  background: rgba(255, 255, 255, 0.1);
}

.hint {
  margin: 20px 0 0;
  font-size: 13px;
  opacity: 0.6;
}
</style>
