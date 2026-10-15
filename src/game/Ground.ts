import type { GameConfig, Theme } from './types'
import { THEMES } from './utils'

export class Ground {
  private groundY: number
  private canvasHeight: number
  private width: number
  private offset = 0

  /** 预渲染缓存：天空 + 两层山 + 地面，全部 HTMLCanvasElement */
  private staticSky!: HTMLCanvasElement
  private farTile!: HTMLCanvasElement
  private midTile!: HTMLCanvasElement
  private groundTile!: HTMLCanvasElement

  /** 每层山的 tile 宽度 = 山的 step（一个完整锯齿峰） */
  private step = 80
  private theme: Theme = 'day'

  constructor(config: GameConfig, theme: Theme = 'day') {
    this.groundY = config.groundY
    this.canvasHeight = config.canvasHeight
    this.width = config.canvasWidth
    this.setTheme(theme)
  }

  /** 运行时切换主题 —— 关卡切换时调用，重新渲染所有 tile */
  setTheme(theme: Theme): void {
    this.theme = theme
    this.buildCache()
  }

  reset(): void {
    this.offset = 0
  }

  update(speed: number, dt: number): void {
    this.offset += speed * dt
    if (this.offset > this.step * 100) this.offset -= this.step * 100
  }

  // ---------- 缓存构建 ----------

  private buildCache(): void {
    const c = THEMES[this.theme]
    this.staticSky = this.makeSkyTile(c.skyTop, c.skyBottom)
    this.farTile = this.makeMountainTile(c.farMountain, 60, 120)
    this.midTile = this.makeMountainTile(c.midMountain, 40, 90)
    this.groundTile = this.makeGroundTile(c)
  }

  private makeSkyTile(top: string, bottom: string): HTMLCanvasElement {
    const c = document.createElement('canvas')
    c.width = this.width
    c.height = this.groundY
    const ctx = c.getContext('2d')!
    const g = ctx.createLinearGradient(0, 0, 0, this.groundY)
    g.addColorStop(0, top)
    g.addColorStop(1, bottom)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, c.width, c.height)

    // 夜空主题额外画星星
    if (this.theme === 'night') {
      ctx.fillStyle = '#FFFFFF'
      for (let i = 0; i < 40; i++) {
        const x = Math.random() * c.width
        const y = Math.random() * (this.groundY * 0.7)
        const r = Math.random() * 1.5 + 0.5
        ctx.globalAlpha = Math.random() * 0.6 + 0.4
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      // 月亮
      ctx.fillStyle = '#F5E6CA'
      ctx.beginPath()
      ctx.arc(c.width - 120, 60, 28, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#1E1F4A'
      ctx.beginPath()
      ctx.arc(c.width - 110, 55, 24, 0, Math.PI * 2)
      ctx.fill()
    }

    return c
  }

  private makeMountainTile(
    color: string,
    baseHeight: number,
    peakHeight: number
  ): HTMLCanvasElement {
    const c = document.createElement('canvas')
    c.width = this.step * 2
    c.height = this.groundY
    const ctx = c.getContext('2d')!
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(0, this.groundY)
    const freq = (Math.PI * 2) / c.width
    for (let i = 0; i < 2; i++) {
      const x0 = i * this.step
      const h = baseHeight + Math.abs(Math.sin((x0 + this.step / 2) * freq)) * peakHeight
      ctx.lineTo(x0 + this.step / 2, this.groundY - h)
      ctx.lineTo(x0 + this.step, this.groundY)
    }
    ctx.lineTo(c.width, this.groundY)
    ctx.closePath()
    ctx.fill()

    // 雪山顶部加白色积雪（snow 主题）
    if (this.theme === 'snow') {
      ctx.fillStyle = 'rgba(255,255,255,0.75)'
      ctx.beginPath()
      for (let i = 0; i < 2; i++) {
        const x0 = i * this.step
        const h = baseHeight + Math.abs(Math.sin((x0 + this.step / 2) * freq)) * peakHeight
        ctx.moveTo(x0 + this.step / 2 - 12, this.groundY - h + 12)
        ctx.lineTo(x0 + this.step / 2, this.groundY - h)
        ctx.lineTo(x0 + this.step / 2 + 12, this.groundY - h + 12)
      }
      ctx.fill()
    }

    return c
  }

  private makeGroundTile(c: typeof THEMES['day']): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = this.step * 10
    canvas.height = this.canvasHeight
    const ctx = canvas.getContext('2d')!

    // 草地层（desert 用沙土色、snow 用淡白、night 用暗绿）
    ctx.fillStyle = c.grass
    ctx.fillRect(0, this.groundY, canvas.width, 10)
    // 地面
    ctx.fillStyle = c.ground
    ctx.fillRect(0, this.groundY + 10, canvas.width, this.canvasHeight - this.groundY - 10)
    // 纹理线
    ctx.strokeStyle = c.groundPattern
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.moveTo(x, this.groundY + 20)
      ctx.lineTo(x + 20, this.groundY + 20)
      ctx.moveTo(x + 10, this.groundY + 40)
      ctx.lineTo(x + 30, this.groundY + 40)
    }
    ctx.stroke()

    // night 主题：地面加零星小点
    if (this.theme === 'night') {
      ctx.fillStyle = 'rgba(255,255,255,0.35)'
      for (let i = 0; i < 15; i++) {
        const x = Math.random() * canvas.width
        const y = this.groundY + 15 + Math.random() * (this.canvasHeight - this.groundY - 20)
        ctx.fillRect(x, y, 2, 2)
      }
    }

    return canvas
  }

  // ---------- 每帧绘制 ----------

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.drawImage(this.staticSky, 0, 0)
    this.drawScrollingTile(ctx, this.farTile, this.offset * 0.3)
    this.drawScrollingTile(ctx, this.midTile, this.offset * 0.6)
    this.drawScrollingTile(ctx, this.groundTile, this.offset)
  }

  private drawScrollingTile(
    ctx: CanvasRenderingContext2D,
    tile: HTMLCanvasElement,
    scrollOffset: number
  ): void {
    const tileW = tile.width
    const o = Math.floor(((scrollOffset % tileW) + tileW) % tileW)
    ctx.save()
    ctx.translate(-o, 0)
    let x = 0
    while (x < this.width + tileW) {
      ctx.drawImage(tile, x, 0)
      x += tileW
    }
    ctx.restore()
  }
}
