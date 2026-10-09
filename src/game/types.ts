/** 矩形（用于绘制 & 碰撞检测） */
export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/** 游戏状态 */
export type GameState = 'menu' | 'playing' | 'over'

/** 游戏配置（可调参数集中在这里） */
export interface GameConfig {
  canvasWidth: number
  canvasHeight: number
  groundY: number // 地面顶部 y 坐标
  gravity: number // 重力加速度
  jumpVelocity: number // 起跳初速度（负值，向上）
  baseSpeed: number // 初始滚动速度 px/frame
  maxSpeed: number // 速度上限
  speedIncrement: number // 每秒速度增加量
  minObstacleGap: number // 障碍物最小间距 px
  maxObstacleGap: number // 障碍物最大间距 px
}

/** 引擎回调 */
export interface GameCallbacks {
  onScoreChange?: (score: number) => void
  onStateChange?: (state: GameState) => void
  onGameOver?: (finalScore: number) => void
}
