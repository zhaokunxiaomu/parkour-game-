import type { GameConfig, Rect, Theme } from './types'
import { THEMES } from './utils'

/** 障碍物类型：box/spike/bird 原有 + flySpike/roller/platform 新增 */
export type ObstacleType =
  | 'box'
  | 'spike'
  | 'bird'
  | 'flySpike'
  | 'roller'
  | 'platform'

/** 障碍子类：deadly 碰到即死；standable 可站立（从上方落下能站） */
export type ObstacleCategory = 'deadly' | 'standable'

export class Obstacle {
  active = false
  type: ObstacleType = 'box'
  category: ObstacleCategory = 'deadly'
  x = 0
  y = 0
  w = 30
  h = 30
  private groundY: number

  /** 动画字段（各类型按需用） */
  rotation = 0 // roller 滚石旋转角度
  floatPhase = 0 // platform 上下浮动相位
  private theme: Theme = 'day'

  setTheme(theme: Theme): void {
    this.theme = theme
  }

  constructor(config: GameConfig) {
    this.groundY = config.groundY
  }

  /** 是否可以被玩家站在上面 */
  isStandable(): boolean {
    return this.category === 'standable'
  }

  /** 从对象池激活并放在指定位置 */
  spawn(type: ObstacleType, x: number): void {
    this.active = true
    this.type = type
    this.x = x
    this.rotation = 0
    this.floatPhase = Math.random() * Math.PI * 2 // 平台随机初始相位

    switch (type) {
      case 'box':
        this.category = 'deadly'
        this.w = 30
        this.h = 30
        this.y = this.groundY - this.h
        break
      case 'spike':
        this.category = 'deadly'
        this.w = 26
        this.h = 26
        this.y = this.groundY - this.h
        break
      case 'bird':
        this.category = 'deadly'
        this.w = 36
        this.h = 24
        this.y = this.groundY - 70
        break
      case 'flySpike':
        this.category = 'deadly'
        this.w = 28
        this.h = 28
        this.y = this.groundY - 72 // 和 bird 同高度，尖刺朝上但底部危险
        break
      case 'roller':
        this.category = 'deadly'
        this.w = 40
        this.h = 40
        this.y = this.groundY - this.h
        break
      case 'platform':
        this.category = 'standable'
        this.w = 70
        this.h = 14
        this.y = this.groundY - 85 // 较高，跳起来能借力站
        break
    }
  }

  update(speed: number, dt: number): void {
    this.x -= speed * dt
    if (this.x + this.w < -40) {
      this.active = false
      return
    }

    // 各类型专属动画
    if (this.type === 'roller') {
      this.rotation += speed * dt * 0.15 // 滚动旋转
    }
    if (this.type === 'platform') {
      this.floatPhase += dt * 0.06 // 上下浮动，增加动感
    }
  }

  /** 仅 platform 使用：浮动后的顶部 y */
  getTopY(): number {
    if (this.type !== 'platform') return this.y
    const float = Math.sin(this.floatPhase) * 3
    return this.y + float
  }

  /** 仅 platform 使用：浮动后的实际 y */
  getRenderY(): number {
    return this.type === 'platform' ? this.getTopY() : this.y
  }

  getHitbox(): Rect {
    const y = this.getRenderY()
    return { x: this.x + 2, y: y + 2, w: this.w - 4, h: this.h - 4 }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const x = Math.round(this.x)
    const y = Math.round(this.getRenderY())
    const c = THEMES[this.theme]

    switch (this.type) {
      case 'box':
        ctx.fillStyle = c.obstacleBox
        ctx.fillRect(x, y, this.w, this.h)
        ctx.strokeStyle = '#3D2817'
        ctx.lineWidth = 1
        ctx.strokeRect(x, y, this.w, this.h)
        ctx.beginPath()
        ctx.moveTo(x, y + this.h / 2)
        ctx.lineTo(x + this.w, y + this.h / 2)
        ctx.stroke()
        break

      case 'spike':
        ctx.fillStyle = c.obstacleSpike
        ctx.beginPath()
        ctx.moveTo(x, y + this.h)
        ctx.lineTo(x + this.w / 2, y)
        ctx.lineTo(x + this.w, y + this.h)
        ctx.closePath()
        ctx.fill()
        break

      case 'bird':
        ctx.fillStyle = c.obstacleBird
        ctx.fillRect(x + 8, y + 4, 22, 14)
        ctx.fillRect(x + 26, y, 10, 10)
        ctx.fillStyle = '#FFA500'
        ctx.fillRect(x + 36, y + 4, 6, 3)
        ctx.fillStyle = '#333'
        const wingUp = Math.floor(Date.now() / 150) % 2 === 0
        ctx.fillRect(x + 12, wingUp ? y - 4 : y + 10, 14, 6)
        break

      case 'flySpike':
        ctx.fillStyle = c.flySpike
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + this.w / 2, y + this.h)
        ctx.lineTo(x + this.w, y)
        ctx.closePath()
        ctx.fill()
        ctx.fillStyle = this.theme === 'night' ? '#F5E6CA' : '#7D3C98'
        const fsWing = Math.floor(Date.now() / 120) % 2 === 0
        ctx.fillRect(x - 8, fsWing ? y + 2 : y + 8, 8, 4)
        ctx.fillRect(x + this.w, fsWing ? y + 2 : y + 8, 8, 4)
        break

      case 'roller':
        ctx.save()
        ctx.translate(x + this.w / 2, y + this.h / 2)
        ctx.rotate(this.rotation)
        ctx.fillStyle = c.roller
        ctx.beginPath()
        ctx.arc(0, 0, this.w / 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#5D6D7E'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(-this.w / 3, 0)
        ctx.lineTo(this.w / 3, 0)
        ctx.moveTo(0, -this.w / 3)
        ctx.lineTo(0, this.w / 3)
        ctx.stroke()
        ctx.restore()
        break

      case 'platform':
        ctx.fillStyle = c.platformBody
        ctx.fillRect(x, y, this.w, this.h)
        ctx.fillStyle = c.platformTop
        ctx.fillRect(x, y, this.w, 3)
        ctx.strokeStyle = '#8B4513'
        ctx.lineWidth = 1
        ctx.strokeRect(x, y, this.w, this.h)
        ctx.strokeStyle = '#A04000'
        ctx.beginPath()
        ctx.moveTo(x + 10, y + 7)
        ctx.lineTo(x + this.w - 10, y + 7)
        ctx.stroke()
        ctx.fillStyle = 'rgba(0,0,0,0.2)'
        ctx.fillRect(x + 2, y + this.h, this.w - 4, 3)
        break
    }
  }
}

/** 障碍物对象池 */
export class ObstaclePool {
  private pool: Obstacle[] = []
  private config: GameConfig

  constructor(config: GameConfig, initialSize = 10) {
    this.config = config
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(new Obstacle(config))
    }
  }

  /** 取一个未激活的，全部激活则扩容 */
  acquire(): Obstacle {
    let o = this.pool.find((p) => !p.active)
    if (!o) {
      o = new Obstacle(this.config)
      this.pool.push(o)
    }
    return o
  }

  activeList(): Obstacle[] {
    return this.pool.filter((p) => p.active)
  }

  reset(): void {
    for (const p of this.pool) p.active = false
  }

  setTheme(theme: Theme): void {
    for (const p of this.pool) p.setTheme(theme)
  }
}
