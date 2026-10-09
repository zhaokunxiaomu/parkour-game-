import type { GameConfig } from './types'

export class Ground {
  private groundY: number
  private canvasHeight: number
  private width: number
  private offset = 0

  /** 预渲染缓存：两层山各一张 tile canvas，每块 = 一个 step（80px） */
  private farTile!: HTMLCanvasElement
  private midTile!: HTMLCanvasElement
  private groundTile!: HTMLCanvasElement // 地面 + 草地 + 纹理，可滚动
  private staticSky!: HTMLCanvasElement // 天空渐变（完全静态）

  /** 每层山的 tile 宽度 = 山的 step（一个完整锯齿峰） */
  private step = 80

  constructor(config: GameConfig) {
    this.groundY = config.groundY
    this.canvasHeight = config.canvasHeight
    this.width = config.canvasWidth
    this.buildCache()
  }

  reset(): void {
    this.offset = 0
  }

  update(speed: number, dt: number): void {
    // offset 足够小时直接 mod，保持滚动感
    this.offset += speed * dt
    if (this.offset > this.step * 100) {
      this.offset -= this.step * 100 // 避免数值膨胀（不影响渲染）
    }
  }

  // ---------- 缓存构建（仅在构造时跑一次） ----------

  private buildCache(): void {
    this.staticSky = this.makeSkyTile()
    this.farTile = this.makeMountainTile('#9FC5E8', 60, 120)
    this.midTile = this.makeMountainTile('#6FA8DC', 40, 90)
    this.groundTile = this.makeGroundTile()
  }

  /** 天空渐变 = 整张画布宽度的一条 */
  private makeSkyTile(): HTMLCanvasElement {
    const c = document.createElement('canvas')
    c.width = this.width
    c.height = this.groundY
    const ctx = c.getContext('2d')!
    const g = ctx.createLinearGradient(0, 0, 0, this.groundY)
    g.addColorStop(0, '#87CEEB')
    g.addColorStop(1, '#E0F6FF')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, c.width, c.height)
    return c
  }

  /** 一块山 tile = 一个完整锯齿峰（step 宽），循环拼接即得到完整背景 */
  private makeMountainTile(
    color: string,
    baseHeight: number,
    peakHeight: number
  ): HTMLCanvasElement {
    const c = document.createElement('canvas')
    c.width = this.step * 2 // 两块山的 step，保证无缝循环
    c.height = this.groundY
    const ctx = c.getContext('2d')!
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(0, this.groundY)
    // 用 2π / tileW 做归一化，保证 tile 整数倍处 sin 都是 0 → 边界无缝
    const freq = (Math.PI * 2) / c.width
    for (let i = 0; i < 2; i++) {
      const x0 = i * this.step
      const h =
        baseHeight +
        Math.abs(Math.sin((x0 + this.step / 2) * freq)) * peakHeight
      ctx.lineTo(x0 + this.step / 2, this.groundY - h)
      ctx.lineTo(x0 + this.step, this.groundY)
    }
    ctx.lineTo(c.width, this.groundY)
    ctx.closePath()
    ctx.fill()
    return c
  }

  /** 地面 + 草地 + 纹理，足够宽，滚动靠 offset 裁切 */
  private makeGroundTile(): HTMLCanvasElement {
    const c = document.createElement('canvas')
    // 宽度 = step * 10，够用了，滚动只做裁切
    c.width = this.step * 10
    c.height = this.canvasHeight
    const ctx = c.getContext('2d')!

    // 草地
    ctx.fillStyle = '#228B22'
    ctx.fillRect(0, this.groundY, c.width, 10)
    // 地面
    ctx.fillStyle = '#8B4513'
    ctx.fillRect(
      0,
      this.groundY + 10,
      c.width,
      this.canvasHeight - this.groundY - 10
    )
    // 纹理线：合并到一个 path 里，只需一次 stroke
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let x = 0; x < c.width; x += 40) {
      ctx.moveTo(x, this.groundY + 20)
      ctx.lineTo(x + 20, this.groundY + 20)
      ctx.moveTo(x + 10, this.groundY + 40)
      ctx.lineTo(x + 30, this.groundY + 40)
    }
    ctx.stroke()
    return c
  }

  // ---------- 每帧绘制（全部 drawImage） ----------

  draw(ctx: CanvasRenderingContext2D): void {
    // 天空（静态整块 draw）
    ctx.drawImage(this.staticSky, 0, 0)

    // 山层：视差滚动 = offset * factor
    this.drawScrollingTile(ctx, this.farTile, this.offset * 0.3)
    this.drawScrollingTile(ctx, this.midTile, this.offset * 0.6)

    // 地面层（完整画布高度，盖住山的底部）
    this.drawScrollingTile(ctx, this.groundTile, this.offset)
  }

  /** 把一个 tile 循环拼接铺满屏幕，实现水平滚动 */
  private drawScrollingTile(
    ctx: CanvasRenderingContext2D,
    tile: HTMLCanvasElement,
    scrollOffset: number
  ): void {
    const tileW = tile.width
    // 归一化到 [0, tileW) 后取整 → translate 永远整数，彻底消除亚像素反锯齿灰缝
    const o = Math.floor(((scrollOffset % tileW) + tileW) % tileW)

    ctx.save()
    ctx.translate(-o, 0)

    // 画够覆盖屏幕右边再多一块（tile 内部自己循环）
    let x = 0
    while (x < this.width + tileW) {
      ctx.drawImage(tile, x, 0)
      x += tileW
    }

    ctx.restore()
  }
}
