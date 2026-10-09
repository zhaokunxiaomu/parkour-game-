import type { GameConfig, Rect } from './types'
import { COLORS } from './utils'

export class Player {
  /** x 固定在屏幕左侧 20% 处 */
  x: number
  y: number
  w = 40
  h = 50
  vy = 0
  onGround = true

  private groundY: number
  private gravity: number
  private jumpVelocity: number

  /** 动画计时 */
  private frameTimer = 0
  private runFrame = 0

  constructor(config: GameConfig) {
    this.x = config.canvasWidth * 0.2
    this.groundY = config.groundY
    this.gravity = config.gravity
    this.jumpVelocity = config.jumpVelocity
    this.y = this.groundY - this.h
  }

  reset(): void {
    this.y = this.groundY - this.h
    this.vy = 0
    this.onGround = true
    this.frameTimer = 0
    this.runFrame = 0
  }

  jump(): boolean {
    if (this.onGround) {
      this.vy = this.jumpVelocity
      this.onGround = false
      return true
    }
    return false
  }

  update(dt: number): void {
    if (!this.onGround) {
      this.vy += this.gravity * dt
      this.y += this.vy * dt
      if (this.y >= this.groundY - this.h) {
        this.y = this.groundY - this.h
        this.vy = 0
        this.onGround = true
      }
    }
    // 跑步动画帧推进
    this.frameTimer += dt
    if (this.frameTimer >= 6) {
      this.frameTimer = 0
      this.runFrame = (this.runFrame + 1) % 4
    }
  }

  /** 碰撞盒（比绘制略小一点，手感更好） */
  getHitbox(): Rect {
    return {
      x: this.x + 4,
      y: this.y + 4,
      w: this.w - 8,
      h: this.h - 8,
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // 身体
    ctx.fillStyle = COLORS.player
    ctx.fillRect(this.x, this.y, this.w, this.h)

    // 眼睛
    ctx.fillStyle = COLORS.playerEye
    ctx.fillRect(this.x + this.w - 14, this.y + 8, 8, 8)
    ctx.fillStyle = '#000'
    ctx.fillRect(this.x + this.w - 10, this.y + 10, 3, 4)

    // 腿部跑步动画
    ctx.fillStyle = '#333'
    const legOffset = this.onGround
      ? [0, 3, 0, -3][this.runFrame]   // 交替前后
      : 2                               // 腾空时腿收起
    ctx.fillRect(this.x + 6, this.y + this.h, 8, 6 + legOffset)
    ctx.fillRect(this.x + this.w - 14, this.y + this.h, 8, 6 - legOffset)
  }
}
