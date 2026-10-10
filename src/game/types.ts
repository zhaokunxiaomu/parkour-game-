/** 矩形（用于绘制 & 碰撞检测） */
export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/** 主题/场景 */
export type Theme = 'day' | 'desert' | 'snow' | 'night'

/** 游戏状态 */
export type GameState = 'menu' | 'transition' | 'playing' | 'paused' | 'over' | 'victory'

/** 关卡定义 */
export interface Level {
  theme: Theme
  targetScore: number // 达到这个分数进入下一关
  name: string
  description: string
}

/** 游戏配置（可调参数集中在这里） */
export interface GameConfig {
  canvasWidth: number
  canvasHeight: number
  groundY: number
  gravity: number
  jumpVelocity: number
  baseSpeed: number
  maxSpeed: number
  speedIncrement: number
  minObstacleGap: number
  maxObstacleGap: number
}

/** 引擎回调 */
export interface GameCallbacks {
  onScoreChange?: (score: number) => void
  onStateChange?: (state: GameState) => void
  onGameOver?: (finalScore: number) => void
  onLevelChange?: (levelIndex: number, level: Level) => void
  onVictory?: () => void
  /** 收集到道具时触发，给 UI 做飘字/音效 */
  onPickup?: (type: PickupType) => void
}

/** 道具类型（和 Pickup.ts 里的定义保持一致） */
export type PickupType = 'coin' | 'shield' | 'boost'
