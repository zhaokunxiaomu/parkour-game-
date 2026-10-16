import type { PickupType } from '../game'

/** GameCanvas.vue defineExpose 的命令式接口，App 端模板 ref 按此类型声明 */
export interface GameCanvasHandle {
  start(): void
  beginPlay(): void
  isIntroPending(): boolean
  pause(): void
  resume(): void
  restart(): void
  returnToMenu(): void
  jump(): void
  crouch(on: boolean): void
  dash(): void
  setSfxEnabled(v: boolean): void
  resumeLoop(): void
  getLevelProgress(): { current: number; target: number; ratio: number }
}

/** 道具拾取飘字条目 */
export interface FloatText {
  id: number
  type: PickupType
  text: string
}
