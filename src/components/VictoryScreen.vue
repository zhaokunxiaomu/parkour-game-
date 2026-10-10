<script setup lang="ts">
defineEmits<{ (e: 'restart'): void; (e: 'menu'): void }>()
defineProps<{ best: number }>()
</script>

<template>
  <div class="overlay" @click.stop>
    <div class="panel">
      <div class="trophy">★</div>
      <h1 class="title">通关成功！</h1>
      <p class="sub">你征服了所有关卡，成为跑酷之王！</p>
      <div class="scores">
        <div class="row"><span class="label">最终最高分</span><span class="value best">{{ best }}</span></div>
      </div>
      <div class="btns">
        <button class="btn primary" @click="$emit('restart')">再玩一次</button>
        <button class="btn ghost" @click="$emit('menu')">返回主菜单</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(6px);
  animation: fadeIn 0.5s ease-out;
}
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

.panel { text-align: center; color: #fff; }

.trophy {
  font-size: 64px;
  color: #FFD700;
  margin-bottom: 12px;
  animation: bounce 1s ease-out;
  text-shadow: 0 0 30px rgba(255,215,0,0.6);
}
@keyframes bounce {
  0% { transform: scale(0) rotate(-20deg) }
  60% { transform: scale(1.2) rotate(10deg) }
  100% { transform: scale(1) rotate(0) }
}

.title {
  margin: 0 0 8px; font-size: 44px; letter-spacing: 4px;
  background: linear-gradient(90deg, #FFD700, #FFA500);
  -webkit-background-clip: text; background-clip: text;
  color: transparent;
}

.sub { margin: 0 0 20px; font-size: 15px; opacity: 0.85; }

.scores { margin-bottom: 24px; }
.row { display: flex; justify-content: center; gap: 12px; font-size: 18px; margin: 6px 0; }
.label { opacity: 0.7; }
.value.best { font-weight: bold; color: #FFD700; min-width: 80px; text-align: right; }

.btns { display: flex; gap: 12px; justify-content: center; }
.btn {
  padding: 10px 28px; font-size: 16px; border: none; border-radius: 8px;
  cursor: pointer; box-shadow: 0 4px 0 rgba(0,0,0,0.3);
  transition: transform 0.08s;
}
.btn:active { transform: translateY(2px); box-shadow: 0 2px 0 rgba(0,0,0,0.3); }
.btn.primary { background: linear-gradient(135deg, #2ed573, #1e90ff); color: #fff; }
.btn.ghost { background: rgba(255,255,255,0.15); color: #fff; border: 1px solid rgba(255,255,255,0.3); }
</style>
