import { computed, ref, watch, onBeforeUnmount, type Ref } from 'vue'
import type { GameState } from '../game'
import { LEVELS } from '../game'

export interface OverlayVisibilityOptions {
  state: Ref<GameState>
  resumeCountdown: Ref<number | null>
  introPending: Ref<boolean>
  levelIndex: Ref<number>
}

/** 蒙层显隐：全部由游戏状态派生的 show* 条件 + 死亡弹窗 0.6s 延迟 */
export function useOverlayVisibility({
  state,
  resumeCountdown,
  introPending,
  levelIndex,
}: OverlayVisibilityOptions) {
  const showStart = computed(() => state.value === 'menu')
  /** 死亡弹窗延迟弹出：先让玩家看清碰撞瞬间，0.6s 后再显示结算卡片 */
  const showOver = ref(false)
  let overPopupTimer: number | null = null
  watch(state, (s) => {
    if (s === 'over') {
      if (overPopupTimer !== null) clearTimeout(overPopupTimer)
      overPopupTimer = window.setTimeout(() => {
        overPopupTimer = null
        showOver.value = true
      }, 600)
    } else {
      if (overPopupTimer !== null) {
        clearTimeout(overPopupTimer)
        overPopupTimer = null
      }
      showOver.value = false
    }
  })
  onBeforeUnmount(() => {
    if (overPopupTimer !== null) clearTimeout(overPopupTimer)
  })

  const showPaused = computed(
    () => state.value === 'paused' && resumeCountdown.value === null
  )
  const showResumeCountdown = computed(() => resumeCountdown.value !== null)
  const showTransition = computed(() => state.value === 'transition')
  /** 第一关开局提示：无进度条、点按钮开始 */
  const isIntroTransition = computed(
    () => state.value === 'transition' && introPending.value
  )
  /** 过渡蒙层展示的关卡：过关过渡时展示下一关，开局提示展示当前关 */
  const transitionLevelIndex = computed(() =>
    isIntroTransition.value ? levelIndex.value : levelIndex.value + 1
  )
  const transitionLevel = computed(() => LEVELS[transitionLevelIndex.value])
  const showVictory = computed(() => state.value === 'victory')
  const showHUD = computed(() => state.value === 'playing')
  const showPauseBtn = computed(() => state.value === 'playing')
  const showLevelInfo = computed(
    () =>
      state.value === 'playing' ||
      state.value === 'paused' ||
      state.value === 'transition'
  )

  return {
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
  }
}
