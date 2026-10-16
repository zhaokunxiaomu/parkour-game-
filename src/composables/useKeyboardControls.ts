import { onMounted, onBeforeUnmount } from 'vue'
import type { GameState } from '../game'

export interface KeyboardControlsOptions {
  getState: () => GameState
  onJump: () => void
  onPause: () => void
  onCrouch: (on: boolean) => void
  onDash: () => void
}

/**
 * 键盘输入：空格/↑ 跳跃、P/Esc 暂停、↓/S 按住下蹲、Shift 冲刺。
 * 仅在 playing 状态响应；menu/paused/over/victory 一律忽略（必须点蒙层按钮）。
 */
export function useKeyboardControls(opts: KeyboardControlsOptions): void {
  function onKey(e: KeyboardEvent) {
    const state = opts.getState()
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault()
      if (state === 'playing') opts.onJump()
      // menu / intro / paused / over / victory：不响应空格，必须点击蒙层按钮
    } else if (e.code === 'KeyP' || e.code === 'Escape') {
      e.preventDefault()
      if (state === 'playing') opts.onPause()
      // paused：不响应键盘继续，必须点"继续"按钮
    } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      e.preventDefault()
      if (state === 'playing') opts.onCrouch(true)
    } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      e.preventDefault()
      if (state === 'playing') opts.onDash()
    }
  }

  function onKeyUp(e: KeyboardEvent) {
    // 松开下方向键 → 结束下蹲（持续状态只在按住时生效）
    if (e.code === 'ArrowDown' || e.code === 'KeyS') opts.onCrouch(false)
  }

  onMounted(() => {
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKeyUp)
  })
  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKey)
    window.removeEventListener('keyup', onKeyUp)
  })
}
