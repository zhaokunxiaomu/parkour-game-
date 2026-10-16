<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  GameCanvas,
  StartScreen,
  GameOverScreen,
  TutorialOverlay,
  PauseScreen,
  LevelTransition,
  VictoryScreen,
  ScoreHUD,
  SvgIcon,
  ResumeCountdown,
  LevelInfoBar,
  FloatTextLayer,
  MobileVirtualControls,
} from './components'
import {
  useResumeCountdown,
  useMobileFullscreen,
  useKeyboardControls,
  useGameSession,
  useOverlayVisibility,
  type GameCanvasHandle,
} from './composables'
import { LEVELS } from './game'
import { THEMES } from './game/utils'

const gameCanvasRef = ref<GameCanvasHandle | null>(null)

/** 继续游戏 3 秒倒计时：倒数结束才真正 resume */
const {
  resumeCountdown,
  start: handleResume,
  stop: stopResumeCountdown,
} = useResumeCountdown(() => gameCanvasRef.value?.resume())

/** 移动端全屏/横屏/RAF 恢复：后台回前台时兜底重启渲染循环 */
const { isPortraitTouch, ensureFullscreen } = useMobileFullscreen(() =>
  gameCanvasRef.value?.resumeLoop()
)

/** 游戏会话：状态数据、引擎回调、持久化、开始/重开/回菜单动作 */
const {
  state,
  score,
  best,
  levelIndex,
  currentLevel,
  progressRatio,
  introPending,
  sfxEnabled,
  floatTexts,
  isShielded,
  showTutorial,
  onScore,
  onState,
  onGameOver,
  onPickup,
  onLevelChange,
  onVictory,
  handleStart,
  handleRestart,
  handleBeginPlay,
  handleBackToMenu,
  handleTutorialDone,
  openTutorialFromHelp,
  toggleSfx,
  pauseGame,
} = useGameSession({ canvas: gameCanvasRef, ensureFullscreen })

/** 根据当前关卡主题算出画布外围的背景色，保证各关卡画面无缝融合 */
const wrapperBg = computed(() => THEMES[currentLevel.value.theme].skyTop)
/** 当前关卡天空色，传给失败蒙层做同色系渐变 */
const themeSky = computed(() => THEMES[currentLevel.value.theme])

useKeyboardControls({
  getState: () => state.value,
  onJump: handleJump,
  onPause: handlePause,
  onCrouch: (on) => gameCanvasRef.value?.crouch(on),
  onDash: () => gameCanvasRef.value?.dash(),
})

function togglePause() {
  if (state.value === 'playing') handlePause()
  else if (state.value === 'paused') handleResume()
}

function handleJump() {
  gameCanvasRef.value?.jump()
}
function handlePause() {
  stopResumeCountdown()
  pauseGame()
}

/** 蒙层显隐：全部派生状态 + 死亡弹窗 0.6s 延迟 */
const {
  showStart,
  showOver,
  showPaused,
  showResumeCountdown,
  showTransition,
  isIntroTransition,
  transitionLevelIndex,
  transitionLevel,
  showVictory,
  showHUD,
  showPauseBtn,
  showLevelInfo,
} = useOverlayVisibility({
  state,
  resumeCountdown,
  introPending,
  levelIndex,
})

function onCanvasClick() {
  if (state.value === 'playing') handleJump()
}
</script>

<template>
  <div
    class="app"
    :class="{ 'app-rotated': isPortraitTouch }"
    :style="{ background: wrapperBg }"
  >
    <div class="game-wrapper">
      <GameCanvas
        ref="gameCanvasRef"
        :theme="currentLevel.theme"
        @click="onCanvasClick"
        @score="onScore"
        @state="onState"
        @gameover="onGameOver"
        @levelchange="onLevelChange"
        @victory="onVictory"
        @pickup="onPickup"
      />

      <!-- 右下角键盘操作提示：playing/paused 时显示，半透明不挡视线 -->
      <div v-if="state === 'playing' || state === 'paused'" class="hint-corner">
        <span>跳跃 空格/↑</span>
        <span>下蹲 ↓/S</span>
        <span>冲刺 Shift</span>
        <span>暂停 P</span>
      </div>

      <!-- 右上角控制：暂停 -->
      <button
        v-if="showPauseBtn"
        class="ctrl-btn pause-btn"
        @click.stop="togglePause"
        title="暂停 (P)"
      >
        <SvgIcon name="pause" />
      </button>

      <!-- HUD：分数 + 关卡名 + 进度条 -->
      <ScoreHUD v-if="showHUD" :score="score" />
      <LevelInfoBar
        v-if="showLevelInfo && !showTransition"
        :level="currentLevel"
        :ratio="progressRatio"
      />

      <!-- 护盾状态 HUD：左上 -->
      <div v-if="showHUD && isShielded" class="shield-hud">
        <SvgIcon name="shield" class="shield-icon" />
        <span class="shield-label">护盾</span>
      </div>

      <FloatTextLayer :items="floatTexts" />

      <MobileVirtualControls
        v-if="showHUD"
        @crouch="(on) => gameCanvasRef?.crouch(on)"
        @dash="gameCanvasRef?.dash()"
        @jump="handleJump()"
      />

      <!-- 蒙层层叠 -->
      <StartScreen
        v-if="showStart"
        :sfx-enabled="sfxEnabled"
        @start="handleStart"
        @toggle-sfx="toggleSfx"
        @help="openTutorialFromHelp"
      />
      <TutorialOverlay v-if="showTutorial" @done="handleTutorialDone" />
      <LevelTransition
        v-if="showTransition"
        :level="transitionLevel"
        :index="transitionLevelIndex"
        :total="LEVELS.length"
        :manual="isIntroTransition"
        @start="handleBeginPlay"
      />
      <PauseScreen
        v-if="showPaused"
        @resume="handleResume"
        @restart="handleRestart"
        @menu="handleBackToMenu"
      />
      <ResumeCountdown v-if="showResumeCountdown" :count="resumeCountdown" />
      <GameOverScreen
        v-if="showOver"
        :score="score"
        :best="best"
        :sky-top="themeSky.skyTop"
        :sky-bottom="themeSky.skyBottom"
        @restart="handleRestart"
        @menu="handleBackToMenu"
      />
      <VictoryScreen
        v-if="showVictory"
        :best="best"
        @restart="handleRestart"
        @menu="handleBackToMenu"
      />
    </div>
  </div>
</template>

<style scoped>
.app {
  width: 100vw;
  height: 100dvh;
  overflow: hidden;
  /* wrapper 背景就是天空色 —— 游戏区外的外围会透出此色 */
  background: #87ceeb;
}

.game-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  /* canvas 的 CSS 尺寸和 wrapper 一样，canvas 内部像素 900×300
     靠 object-fit: contain 自动等比缩放居中，外围透出 app 的天空色 */
  cursor: pointer;
  touch-action: manipulation;
  user-select: none;
}

/* 右下角键盘操作提示（playing / paused 时显示） */
.hint-corner {
  position: absolute;
  bottom: 8px;
  right: 10px;
  z-index: 10;
  display: flex;
  gap: 10px;
  padding: 5px 10px;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(4px);
  border-radius: 14px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.75);
  pointer-events: none;
  line-height: 1;
  white-space: nowrap;
}
.hint-corner span {
  padding: 2px 0;
}
/* 桌面显示，移动端隐藏（有虚拟按钮） */
@media (pointer: coarse) {
  .hint-corner {
    display: none;
  }
}

/* ===== 竖屏自动横屏：CSS 旋转 90° 兜底（iOS 等不支持方向锁定的浏览器） ===== */
.app-rotated {
  position: fixed;
  top: 0;
  left: 0;
  width: 100dvh;
  height: 100vw;
  transform: rotate(90deg) translateY(-100%);
  transform-origin: left top;
}

/* 控制按钮：统一圆形样式 */
.ctrl-btn {
  position: absolute;
  top: 8px;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  font-size: 16px;
  cursor: pointer;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    transform 0.1s,
    background 0.2s;
}
.ctrl-btn:hover {
  background: #fff;
  transform: scale(1.08);
}
.ctrl-btn:active {
  transform: scale(0.95);
}

.pause-btn {
  right: 8px;
  font-weight: bold;
  color: #2c3e50;
}
.levels-btn {
  right: 96px;
  font-size: 13px;
  font-weight: bold;
  color: #2c3e50;
}

/* ===== 道具 HUD ===== */

.shield-hud {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(100, 200, 255, 0.3);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(100, 200, 255, 0.6);
  border-radius: 16px;
  color: #fff;
  font-size: 13px;
  font-weight: bold;
  z-index: 15;
  pointer-events: none;
}
.shield-icon {
  font-size: 16px;
}
</style>
