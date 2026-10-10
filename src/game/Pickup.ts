import type { GameConfig, Rect, Theme } from './types'

/** 道具类型：金币 / 护盾 / 加速鞋 */
export type PickupType = 'coin' | 'shield' | 'boost'

export class Pickup {
  active = false
  type: PickupType = 'coin'
  x = 0
  y = 0
  w = 22
  h = 22

  /** 动画计时 */
  private bobPhase = 0
  private sparkPhase = 0
  private groundY: number

  constructor(config: GameConfig) {
    this.groundY = config.groundY
  }

  /** 保持接口一致，道具暂时不区分主题色 */
  setTheme(_theme: unknown): void {}

  /** 从对象池激活并放在指定位置 */
  spawn(type: PickupType, x: number, y?: number): void {
    this.active = true
    this.type = type
    this.x = x
    this.bobPhase = Math.random() * Math.PI * 2
    this.sparkPhase = 0

    // 默认位置：离地一定高度（和 bird 不同，道具在中上部，跳跃能拿到）
    const defaultY = y ?? this.groundY - 90
    switch (type) {
      case 'coin':
        this.w = 16
        this.h = 16
        this.y = defaultY
        break
      case 'shield':
        this.w = 22
        this.h = 22
        this.y = defaultY
        break
      case 'boost':
        this.w = 24
        this.h = 22
        this.y = defaultY
        break
    }
  }

  update(speed: number, dt: number): void {
    this.x -= speed * dt
    if (this.x + this.w < -40) {
      this.active = false
      return
    }
    this.bobPhase += dt * 0.08
    this.sparkPhase += dt
  }

  getHitbox(): Rect {
    return { x: this.x, y: this.y, w: this.w, h: this.h }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const bob = Math.sin(this.bobPhase) * 3
    const x = Math.round(this.x)
    const y = Math.round(this.y + bob)

    switch (this.type) {
      case 'coin': {
        // 金币（圆形 + 闪亮）
        const cx = x + this.w / 2
        const cy = y + this.h / 2
        ctx.fillStyle = '#F1C40F'
        ctx.beginPath()
        ctx.arc(cx, cy, this.w / 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#B7950B'
        ctx.lineWidth = 1.5
        ctx.stroke()
        // ￥ 符号（简写 ¢）
        ctx.fillStyle = '#B7950B'
        ctx.font = 'bold 10px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('¢', cx, cy + 1)
        // 闪光粒子
        if (Math.floor(this.sparkPhase / 10) % 3 === 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.8)'
          ctx.fillRect(x + this.w + 2, y + 2, 2, 2)
          ctx.fillRect(x - 3, y + this.h - 4, 2, 2)
        }
        break
      }

      case 'shield': {
        // 盾牌（半圆 + 十字）
        ctx.fillStyle = '#5DADE2'
        ctx.beginPath()
        ctx.arc(x + this.w / 2, y + 6, this.w / 2, Math.PI, 0)
        ctx.lineTo(x + this.w, y + this.h)
        ctx.lineTo(x, y + this.h)
        ctx.closePath()
        ctx.fill()
        ctx.strokeStyle = '#2874A6'
        ctx.lineWidth = 1.5
        ctx.stroke()
        // 十字
        ctx.fillStyle = '#fff'
        ctx.fillRect(x + this.w / 2 - 1.5, y + 5, 3, 10)
        ctx.fillRect(x + this.w / 2 - 4, y + 8.5, 8, 3)
        break
      }

      case 'boost': {
        // 闪电加速鞋
        ctx.fillStyle = '#F39C12'
        ctx.beginPath()
        ctx.moveTo(x + 4, y)
        ctx.lineTo(x + 14, y)
        ctx.lineTo(x + 8, y + 10)
        ctx.lineTo(x + 18, y + 10)
        ctx.lineTo(x + 6, y + this.h)
        ctx.lineTo(x + 12, y + 12)
        ctx.lineTo(x + 4, y + 12)
        ctx.closePath()
        ctx.fill()
        // 发光
        if (Math.floor(this.sparkPhase / 6) % 2 === 0) {
          ctx.strokeStyle = 'rgba(255,220,100,0.6)'
          ctx.lineWidth = 2
          ctx.stroke()
        }
        break
      }
    }
  }
}

/** 道具对象池 */
export class PickupPool {
  private pool: Pickup[] = []
  private config: GameConfig

  constructor(config: GameConfig, initialSize = 8) {
    this.config = config
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(new Pickup(config))
    }
  }

  acquire(): Pickup {
    let p = this.pool.find((q) => !q.active)
    if (!p) {
      p = new Pickup(this.config)
      this.pool.push(p)
    }
    return p
  }

  activeList(): Pickup[] {
    return this.pool.filter((p) => p.active)
  }

  reset(): void {
    for (const p of this.pool) p.active = false
  }

  setTheme(theme: Theme): void {
    for (const p of this.pool) p.setTheme(theme)
  }
}
