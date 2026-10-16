<script setup lang="ts">
/**
 * 新手图文引导轮播：4 张卡片教跳跃 / 下蹲 / 冲刺 / 障碍与道具。
 * 桌面端显示键盘键帽，移动端显示触屏按钮（CSS pointer 媒体查询切换）。
 * 是否首次弹出由外层 App.vue 用 localStorage 控制，本组件只管展示与翻页。
 */
import { ref } from 'vue'
import SvgIcon from './SvgIcon.vue'

const emit = defineEmits<{ done: [] }>()

const step = ref(0)
const total = 4

function next() {
  if (step.value < total - 1) step.value++
  else emit('done')
}
function prev() {
  if (step.value > 0) step.value--
}
</script>

<template>
  <div class="overlay" @click.stop>
    <div class="card">
      <button class="skip" @click="emit('done')">跳过</button>

      <!-- 1 跳跃 -->
      <div v-if="step === 0" class="slide">
        <div class="icon-badge jump-badge">
          <SvgIcon name="arrow-up" />
        </div>
        <h2>跳跃</h2>
        <p class="desc">跃起躲过仙人掌、滚石和尖刺，可在空中二段跳</p>
        <div class="keys">
          <span class="kbd">
            <span class="cap">空格</span>
            <span class="cap">↑</span>
          </span>
          <span class="touch"><span class="cap">点击屏幕任意处</span></span>
        </div>
      </div>

      <!-- 2 下蹲 -->
      <div v-if="step === 1" class="slide">
        <div class="icon-badge crouch-badge">
          <SvgIcon name="arrow-down" />
        </div>
        <h2>下蹲</h2>
        <p class="desc">按住让身体压低，从飞行尖刺和横杆下方钻过去</p>
        <div class="keys">
          <span class="kbd">
            <span class="cap">↓</span>
            <span class="cap">S</span>
          </span>
          <span class="touch"><span class="cap">按住左下「下蹲」键</span></span>
        </div>
      </div>

      <!-- 3 冲刺 -->
      <div v-if="step === 2" class="slide">
        <div class="icon-badge dash-badge">
          <SvgIcon name="dash" />
        </div>
        <h2>冲刺</h2>
        <p class="desc">
          短暂无敌加速，大口吃金币串！但冲起来视线会变快，注意躲障碍
        </p>
        <div class="keys">
          <span class="kbd"><span class="cap">Shift</span></span>
          <span class="touch"><span class="cap">左下「冲刺」键</span></span>
        </div>
      </div>

      <!-- 4 障碍与道具 -->
      <div v-if="step === 3" class="slide">
        <h2>障碍与道具</h2>
        <ul class="list">
          <li>
            <span class="dot deadly"></span>
            <span>
              <b>尖刺 / 仙人掌 / 滚石</b>
              ：碰到即失败
            </span>
          </li>
          <li>
            <span class="dot standable"></span>
            <span>
              <b>木箱 / 平台</b>
              ：可以踩在头顶借力跳
            </span>
          </li>
          <li>
            <span class="dot coin"></span>
            <span>
              <b>金币</b>
              ：+10 分，常成串出现
            </span>
          </li>
          <li>
            <span class="dot shield"></span>
            <span>
              <b>护盾</b>
              ：挡一次致命碰撞
            </span>
          </li>
          <li>
            <span class="dot boost"></span>
            <span>
              <b>加速鞋</b>
              ：短时间提速得分
            </span>
          </li>
        </ul>
      </div>

      <!-- 底部：圆点 + 翻页 -->
      <div class="footer">
        <div class="dots">
          <span
            v-for="i in total"
            :key="i"
            class="dot-ind"
            :class="{ active: step === i - 1 }"
          />
        </div>
        <div class="nav">
          <button v-if="step > 0" class="btn ghost" @click="prev">
            上一步
          </button>
          <button class="btn primary" @click="next">
            {{ step === total - 1 ? '开始冒险' : '下一步' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: absolute;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 亮色蒙层：淡蓝白低透明度，保持场景通透明亮 */
  background: rgba(215, 235, 250, 0.28);
  backdrop-filter: blur(8px) saturate(120%);
  -webkit-backdrop-filter: blur(8px) saturate(120%);
  padding: 16px;
}

.card {
  position: relative;
  width: min(380px, 94%);
  padding: 26px 26px 20px;
  border-radius: 18px;
  /* 毛玻璃：半透明白 + 强模糊，透出身后模糊场景 */
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.75);
  box-shadow:
    0 18px 50px rgba(30, 60, 90, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.85);
  color: #2c3e50;
  text-align: center;
  animation: card-in 0.3s cubic-bezier(0.34, 1.4, 0.64, 1);
}
@keyframes card-in {
  0% {
    transform: translateY(20px) scale(0.94);
    opacity: 0;
  }
  100% {
    transform: none;
    opacity: 1;
  }
}

.skip {
  position: absolute;
  top: 12px;
  right: 14px;
  border: none;
  background: none;
  font-size: 13px;
  color: #8aa0b4;
  cursor: pointer;
  padding: 4px 6px;
}
.skip:hover {
  color: #2c3e50;
}

.slide {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  min-height: 200px;
  justify-content: center;
}
.slide h2 {
  margin: 0;
  font-size: 22px;
  letter-spacing: 2px;
}
.desc {
  margin: 0;
  font-size: 14px;
  color: #5a6c7f;
  line-height: 1.6;
}

.icon-badge {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-bottom: 4px;
  box-shadow: 0 6px 16px rgba(30, 60, 90, 0.25);
}
.icon-badge svg {
  width: 32px;
  height: 32px;
}
.jump-badge {
  background: linear-gradient(135deg, #3aa0ff, #2f6fe4);
}
.crouch-badge {
  background: linear-gradient(135deg, #46b06a, #2e8b57);
}
.dash-badge {
  background: linear-gradient(135deg, #ff9f43, #f0703c);
}

/* 键帽 */
.keys {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}
.kbd {
  display: inline-flex;
  gap: 8px;
}
.touch {
  display: none;
}
.cap {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 8px;
  background: #eef3f8;
  border: 1px solid #cdd8e3;
  box-shadow: 0 2px 0 #c3ced9;
  font-size: 13px;
  font-weight: 700;
  color: #2c3e50;
}
@media (pointer: coarse) {
  .kbd {
    display: none;
  }
  .touch {
    display: inline-flex;
  }
}

/* 第 4 页列表 */
.list {
  list-style: none;
  margin: 4px 0 0;
  padding: 0;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.list li {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13.5px;
  color: #44566a;
}
.list b {
  color: #2c3e50;
}
.dot {
  flex: none;
  width: 14px;
  height: 14px;
  border-radius: 4px;
}
.dot.deadly {
  background: #e74c3c;
}
.dot.standable {
  background: #b0713a;
}
.dot.coin {
  background: #f1c40f;
  border-radius: 50%;
}
.dot.shield {
  background: #3aa0ff;
  border-radius: 50%;
}
.dot.boost {
  background: #9b59b6;
  border-radius: 50%;
}

/* 底部导航 */
.footer {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.dots {
  display: flex;
  gap: 7px;
}
.dot-ind {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #cdd8e3;
  transition: all 0.2s;
}
.dot-ind.active {
  background: #2f6fe4;
  transform: scale(1.25);
}
.nav {
  display: flex;
  gap: 10px;
}
.btn {
  border: none;
  border-radius: 10px;
  padding: 10px 26px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.08s,
    filter 0.15s;
}
.btn:active {
  transform: translateY(2px);
}
.btn.primary {
  color: #fff;
  background: linear-gradient(135deg, #3aa0ff, #2f6fe4);
  box-shadow: 0 4px 0 #2456b8;
}
.btn.primary:active {
  box-shadow: 0 1px 0 #2456b8;
}
.btn.ghost {
  background: transparent;
  color: #5a6c7f;
  border: 1.5px solid #cdd8e3;
}

/* 移动端横屏：压缩高度 */
@media (orientation: landscape) and (max-height: 460px) {
  .card {
    width: min(520px, 94%);
    padding: 16px 22px 14px;
  }
  .slide {
    min-height: 130px;
    gap: 6px;
  }
  .icon-badge {
    width: 48px;
    height: 48px;
  }
  .slide h2 {
    font-size: 18px;
  }
  .footer {
    margin-top: 10px;
  }
}
</style>
