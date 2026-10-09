import type { GameConfig, Rect } from './types'
import { COLORS } from './utils'

export type ObstacleType = 'box' | 'spike' | 'bird'

export class Obstacle {
  active = false
  type: ObstacleType = 'box'
  x = 0
  y = 0
  w = 30
  h = 30
  private groundY: number

  constructor(config: GameConfig) {
    this.groundY = config.groundY
  }

  /** 从对象池激活并放在指定位置 */
  spawn(type: ObstacleType, x: number): void {
    this.active = true
    this.type = type
    this.x = x

    switch (type) {
      case 'box':
        this.w = 30
        this.h = 30
        this.y = this.groundY - this.h
        break
      case 'spike':
        this.w = 26
        this.h = 26
        this.y = this.groundY - this.h
        break
      case 'bird':
        this.w = 36
        this.h = 24
        this.y = this.groundY - 70   // 悬空，必须跳过
        break
    }
  }

  update(speed: number, dt: number): void {
    this.x -= speed * dt
    if (this.x + this.w < -20) {
      this.active = false
    }
  }

  getHitbox(): Rect {
    return { x: this.x + 2, y: this.y + 2, w: this.w - 4, h: this.h - 4 }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    switch (this.type) {
      case 'box':
        ctx.fillStyle = COLORS.obstacleBox
        ctx.fillRect(this.x, this.y, this.w, this.h)
        // 木纹
        ctx.strokeStyle = '#3D2817'
        ctx.lineWidth = 1
        ctx.strokeRect(this.x, this.y, this.w, this.h)
        ctx.beginPath()
        ctx.moveTo(this.x, this.y + this.h / 2)
        ctx.lineTo(this.x + this.w, this.y + this.h / 2)
        ctx.stroke()
        break

      case 'spike':
        ctx.fillStyle = COLORS.obstacleSpike
        ctx.beginPath()
        ctx.moveTo(this.x, this.y + this.h)
        ctx.lineTo(this.x + this.w / 2, this.y)
        ctx.lineTo(this.x + this.w, this.y + this.h)
        ctx.closePath()
        ctx.fill()
        break

      case 'bird':
        ctx.fillStyle = COLORS.obstacleBird
        // 身体
        ctx.fillRect(this.x + 8, this.y + 4, 22, 14)
        // 头
        ctx.fillRect(this.x + 26, this.y, 10, 10)
        // 嘴
        ctx.fillStyle = '#FFA500'
        ctx.fillRect(this.x + 36, this.y + 4, 6, 3)
        // 翅膀（拍动）
        ctx.fillStyle = '#333'
        const wingUp = Math.floor(Date.now() / 150) % 2 === 0
        ctx.fillRect(this.x + 12, wingUp ? this.y - 4 : this.y + 10, 14, 6)
        break
    }
  }
}

/** 障碍物对象池 */
export class ObstaclePool {
  private pool: Obstacle[] = []
  private config: GameConfig

  constructor(config: GameConfig, initialSize = 8) {
    this.config = config
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(new Obstacle(config))
    }
  }

  /** 取一个未激活的，全部激活则扩容 */
  acquire(): Obstacle {
    let o = this.pool.find(p => !p.active)
    if (!o) {
      o = new Obstacle(this.config)
      this.pool.push(o)
    }
    return o
  }

  activeList(): Obstacle[] {
    return this.pool.filter(p => p.active)
  }

  reset(): void {
    for (const p of this.pool) p.active = false
  }
}
