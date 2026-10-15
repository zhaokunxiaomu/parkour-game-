<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  score: number
  best: number
  /** 当前关卡天空色（失败时蒙层与关卡背景协调） */
  skyTop?: string
  skyBottom?: string
}>()
defineEmits<{ (e: 'restart'): void; (e: 'menu'): void }>()

/** #rrggbb → rgba 字符串 */
function hexToRgba(hex: string, alpha: number): string {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** 蒙层渐变：深色底保证卡片对比度，叠加关卡天空色 tint 让整体与当前关卡协调 */
const overlayStyle = computed(() => {
  const top = hexToRgba(props.skyTop ?? '#87ceeb', 0.55)
  const bottom = hexToRgba(props.skyBottom ?? '#5aa9d6', 0.75)
  return {
    background: `linear-gradient(180deg, ${top}, ${bottom}), rgba(8, 10, 20, 0.45)`,
  }
})

const isNewBest = computed(() => props.score >= props.best && props.score > 0)

/** 根据得分给一句鼓励 */
const cheer = computed(() => {
  if (props.score >= 2000) return '差一点就是跑酷之王！'
  if (props.score >= 1000) return '身手渐入佳境，再战！'
  if (props.score >= 300) return '手感不错，下次更远！'
  return '热身结束，正式开跑！'
})
</script>

<template>
  <div class="overlay" :style="overlayStyle" @click.stop>
    <div class="card">
      <!-- 顶部图标 -->
      <div class="badge-icon">
        <svg viewBox="0 0 24 24" width="34" height="34" fill="none">
          <path
            d="M12 3a7 7 0 0 0-7 7c0 2.4 1.2 4.5 3 5.8V19a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-3.2c1.8-1.3 3-3.4 3-5.8a7 7 0 0 0-7-7Z"
            stroke="#fff"
            stroke-width="1.8"
            stroke-linejoin="round"
          />
          <circle cx="9.5" cy="10.5" r="1.4" fill="#fff" />
          <circle cx="14.5" cy="10.5" r="1.4" fill="#fff" />
          <path
            d="M9.5 14.5c.8.7 4.2.7 5 0"
            stroke="#fff"
            stroke-width="1.6"
            stroke-linecap="round"
          />
        </svg>
      </div>

      <h1 class="title">GAME OVER</h1>
      <p class="cheer">{{ cheer }}</p>

      <!-- 新纪录横幅 -->
      <div v-if="isNewBest" class="record-banner">
        <svg viewBox="0 0 24 24" width="14" height="14">
          <path
            d="M12 2.5l2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 16.2l-5.6 3.3 1.3-6.2L3 7l6.3-.7L12 2.5Z"
            fill="#ffd700"
          />
        </svg>
        <span>新纪录诞生！</span>
      </div>

      <!-- 数据块 -->
      <div class="stats">
        <div class="stat">
          <span class="stat-label">本局得分</span>
          <span class="stat-value">{{ score }}</span>
        </div>
        <div class="stat-divider" />
        <div class="stat">
          <span class="stat-label">历史最高</span>
          <span class="stat-value gold">{{ best }}</span>
        </div>
      </div>

      <!-- 按钮 -->
      <div class="btns">
        <button class="btn btn-primary" @click="$emit('restart')">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
            <path
              d="M4 12a8 8 0 0 1 13.7-5.6M20 12a8 8 0 0 1-13.7 5.6"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
            <path
              d="M17.5 3.5v3.4h-3.4M6.5 20.5v-3.4h3.4"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span>再来一局</span>
        </button>
        <button class="btn btn-ghost" @click="$emit('menu')">回到主菜单</button>
      </div>
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
  background: rgba(15, 18, 30, 0.32);
  backdrop-filter: blur(2px);
  overflow-y: auto;
  /* 避开手机刘海/底部横条安全区 */
  padding: calc(12px + env(safe-area-inset-top))
    calc(16px + env(safe-area-inset-right))
    calc(16px + env(safe-area-inset-bottom))
    calc(16px + env(safe-area-inset-left));
}

/* ===== 结算卡片（毛玻璃：半透明白 + 强模糊，透出身后模糊场景） ===== */
.card {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: min(340px, 92%);
  padding: 26px 28px 24px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.42);
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.65);
  box-shadow:
    0 18px 50px rgba(30, 60, 90, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  color: #2c3e50;
  text-align: center;
  animation: card-in 0.35s cubic-bezier(0.34, 1.4, 0.64, 1);
}
@keyframes card-in {
  0% {
    transform: translateY(24px) scale(0.92);
    opacity: 0;
  }
  100% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

/* 图标 */
.badge-icon {
  width: 62px;
  height: 62px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ff6b6b, #e74c3c);
  box-shadow: 0 6px 18px rgba(231, 76, 60, 0.45);
  margin-bottom: 12px;
}

.title {
  margin: 0;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: 4px;
  background: linear-gradient(180deg, #34495e, #7f8c9b);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.cheer {
  margin: 6px 0 0;
  font-size: 13px;
  color: rgba(44, 62, 80, 0.65);
}

/* 新纪录横幅 */
.record-banner {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding: 5px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  color: #4a3200;
  background: linear-gradient(135deg, #ffe066, #ffb703);
  box-shadow: 0 4px 14px rgba(255, 183, 3, 0.4);
  animation: pop 0.5s ease-out 0.2s backwards;
}
@keyframes pop {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  60% {
    transform: scale(1.12);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 数据块 */
.stats {
  display: flex;
  align-items: stretch;
  gap: 18px;
  width: 100%;
  margin: 18px 0 20px;
  padding: 14px 8px;
  border-radius: 12px;
  background: rgba(44, 62, 80, 0.1);
  border: 1px solid rgba(44, 62, 80, 0.14);
}
.stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.stat-label {
  font-size: 12px;
  letter-spacing: 1px;
  color: rgba(44, 62, 80, 0.55);
}
.stat-value {
  font-size: 30px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
  color: #2c3e50;
}
.stat-value.gold {
  color: #e6a700;
}
.stat-divider {
  width: 1px;
  background: rgba(44, 62, 80, 0.14);
}

/* 按钮 */
.btns {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
  width: 100%;
}
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 0;
  font-size: 16px;
  font-weight: 700;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition:
    transform 0.08s,
    filter 0.15s;
}
.btn:active {
  transform: translateY(2px) scale(0.98);
}
.btn-primary {
  color: #fff;
  background: linear-gradient(135deg, #2ed573, #1e90ff);
  box-shadow:
    0 5px 0 rgba(30, 100, 180, 0.45),
    0 8px 20px rgba(30, 144, 255, 0.35);
}
.btn-primary:active {
  box-shadow: 0 2px 0 rgba(30, 100, 180, 0.45);
}
.btn-primary:hover {
  filter: brightness(1.08);
}
.btn-ghost {
  color: rgba(44, 62, 80, 0.75);
  background: transparent;
  border: 1px solid rgba(44, 62, 80, 0.25);
}
.btn-ghost:hover {
  background: rgba(44, 62, 80, 0.06);
}

/* 触屏小屏（横屏手机）：卡片横向紧凑，按钮横排 */
@media (pointer: coarse), (max-height: 420px) {
  .card {
    width: min(420px, 94%);
    padding: 16px 20px 14px;
  }
  .badge-icon {
    width: 46px;
    height: 46px;
    margin-bottom: 8px;
  }
  .badge-icon svg {
    width: 26px;
    height: 26px;
  }
  .title {
    font-size: 20px;
  }
  .cheer {
    font-size: 12px;
  }
  .record-banner {
    margin-top: 8px;
    padding: 3px 10px;
    font-size: 12px;
  }
  .stats {
    margin: 10px 0 12px;
    padding: 8px 6px;
  }
  .stat-value {
    font-size: 22px;
  }
  .btns {
    flex-direction: row;
  }
  .btn {
    flex: 1;
    padding: 9px 0;
    font-size: 14px;
  }
}
</style>
