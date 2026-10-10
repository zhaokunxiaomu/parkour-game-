<script setup lang="ts">
import { LEVELS } from '../game'

defineEmits<{ (e: 'goto', index: number): void }>()

const themeIcons: Record<string, string> = {
  day: '☀️', desert: '🌵', snow: '❄️', night: '🌙',
}
</script>

<template>
  <div class="overlay" @click.stop>
    <div class="panel">
      <h1 class="title">选择关卡</h1>
      <div class="levels">
        <button
          v-for="(lv, i) in LEVELS"
          :key="i"
          class="level-card"
          :class="{ active: i === 0 }"
          @click="$emit('goto', i)"
        >
          <div class="icon">{{ themeIcons[lv.theme] }}</div>
          <div class="name">{{ lv.name }}</div>
          <div class="desc">{{ lv.description }}</div>
          <div class="target">目标 {{ lv.targetScore }}</div>
          <div class="badge">第 {{ i + 1 }} 关</div>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(3px);
}
.panel { text-align: center; color: #fff; padding: 10px; }

.title {
  margin: 0 0 20px; font-size: 28px; letter-spacing: 3px;
  text-shadow: 2px 2px 0 rgba(0,0,0,0.5);
}

.levels {
  display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;
  max-width: 720px;
}

.level-card {
  position: relative;
  width: 150px; padding: 18px 12px 14px;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 10px;
  cursor: pointer;
  color: #fff;
  transition: transform 0.15s, background 0.2s, border-color 0.2s;
  text-align: center;
}
.level-card:hover { transform: translateY(-3px); background: rgba(255,255,255,0.22); border-color: rgba(255,255,255,0.5); }
.level-card:active { transform: translateY(-1px); }

.icon { font-size: 32px; margin-bottom: 4px; }
.name { font-size: 17px; font-weight: bold; margin-bottom: 2px; }
.desc { font-size: 11px; opacity: 0.7; margin-bottom: 8px; }
.target { font-size: 12px; color: #FFD700; }
.badge {
  position: absolute; top: 6px; left: 6px;
  font-size: 10px; padding: 1px 6px;
  background: rgba(0,0,0,0.3); border-radius: 4px;
  opacity: 0.8;
}
</style>
