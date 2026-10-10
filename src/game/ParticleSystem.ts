/**
 * 轻量粒子系统
 * 零运行时依赖，所有绘制走 Canvas 2D 基础 API
 * 使用方式：
 *   const ps = new ParticleSystem()
 *   ps.emitDust(x, y)          // 跳跃尘土
 *   ps.emitDebris(x, y)        // 撞击碎片
 *   ps.emitCoinStar(x, y)      // 金币星星（留接口，等 Pickup 道具上线直接用）
 *   ps.update(dt)
 *   ps.draw(ctx)
 */

/** 单个粒子 */
interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  /** 剩余寿命（帧单位，1帧≈16.67ms），归零自动回收 */
  life: number
  /** 初始寿命，用于计算 life 比例做 fade */
  maxLife: number
  /** 初始像素尺寸 */
  initSize: number
  /** 当前像素尺寸（可以受 shrink 影响） */
  size: number
  /** 颜色 */
  color: string
  /** 重力（正 = 向下加速，负 = 向上飘，0 = 无重力） */
  gravity: number
  /** 是否随寿命衰减变小 */
  shrink: boolean
  /** 是否用三角形碎片（debris 用）；默认 false 画圆/方块 */
  debris: boolean
  /** debris 旋转角度（弧度） */
  rot: number
  /** debris 角速度 */
  vrot: number
}

/** 构造 emit 的配置选项（可选） */
interface EmitOpts {
  /** 发射数量，默认按类型自动选 */
  count?: number
  /** 颜色覆盖 */
  color?: string
}

export class ParticleSystem {
  private list: Particle[] = []

  /** 当前活跃粒子数（调试用） */
  get count(): number {
    return this.list.length
  }

  // ====== 预设发射 ======

  /**
   * 跳跃尘土 —— 起跳瞬间脚下喷一团灰棕色小圆点
   */
  emitDust(x: number, y: number, opts: EmitOpts = {}): void {
    const count = opts.count ?? 6
    const color = opts.color ?? '#B0A080'
    for (let i = 0; i < count; i++) {
      const spread = 12
      this.list.push({
        x: x + (Math.random() - 0.5) * spread,
        y,
        vx: (Math.random() - 0.5) * 2,
        vy: -Math.random() * 1.5,   // 向上喷一点
        life: 20 + Math.random() * 10,
        maxLife: 30,
        initSize: 3 + Math.random() * 2,
        size: 4,
        color,
        gravity: 0.25,               // 缓慢回落
        shrink: true,
        debris: false,
        rot: 0,
        vrot: 0,
      })
    }
  }

  /**
   * 撞击碎片 —— Game Over 时在碰撞位置爆一团彩色三角碎片
   */
  emitDebris(x: number, y: number, opts: EmitOpts = {}): void {
    const count = opts.count ?? 22
    const palette = ['#E74C3C', '#C0392B', '#F39C12', '#F1C40F', '#2C3E50']
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 2 + Math.random() * 5
      this.list.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,   // 整体微微向上喷
        life: 40 + Math.random() * 25,
        maxLife: 65,
        initSize: 4 + Math.random() * 4,
        size: 6,
        color: opts.color ?? palette[Math.floor(Math.random() * palette.length)],
        gravity: 0.32,
        shrink: true,
        debris: true,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.3,
      })
    }
  }

  /**
   * 金币星星 —— 拾取金币时从该位置向上飘几颗金色小圆点
   * 等 Pickup 道具实现后直接在拾取点调用
   */
  emitCoinStar(x: number, y: number, opts: EmitOpts = {}): void {
    const count = opts.count ?? 8
    for (let i = 0; i < count; i++) {
      this.list.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -1 - Math.random() * 2,   // 向上飘
        life: 35 + Math.random() * 15,
        maxLife: 50,
        initSize: 3 + Math.random() * 2,
        size: 4,
        color: opts.color ?? '#F1C40F',
        gravity: -0.05,                // 负重力 = 继续上飘一点点
        shrink: true,
        debris: false,
        rot: 0,
        vrot: 0,
      })
    }
  }

  /**
   * 通用 emit（高级用法，特殊效果时用）
   */
  emit(opts: Partial<Particle> & { count?: number }): void {
    const count = opts.count ?? 1
    for (let i = 0; i < count; i++) {
      this.list.push({
        x: opts.x ?? 0,
        y: opts.y ?? 0,
        vx: opts.vx ?? 0,
        vy: opts.vy ?? 0,
        life: opts.life ?? 30,
        maxLife: opts.maxLife ?? opts.life ?? 30,
        initSize: opts.initSize ?? 4,
        size: opts.size ?? opts.initSize ?? 4,
        color: opts.color ?? '#FFF',
        gravity: opts.gravity ?? 0,
        shrink: opts.shrink ?? true,
        debris: opts.debris ?? false,
        rot: opts.rot ?? 0,
        vrot: opts.vrot ?? 0,
      })
    }
  }

  // ====== 主循环 ======

  update(dt: number): void {
    // 倒序遍历，方便 splice
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i]
      p.vy += p.gravity * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      if (p.debris) p.rot += p.vrot * dt
      if (p.shrink) {
        p.size = p.initSize * Math.max(p.life / p.maxLife, 0)
      }
      p.life -= dt
      if (p.life <= 0) {
        this.list.splice(i, 1)
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.list.length === 0) return

    for (const p of this.list) {
      const x = Math.round(p.x)
      const y = Math.round(p.y)
      const alpha = Math.max(p.life / p.maxLife, 0)
      ctx.globalAlpha = alpha
      ctx.fillStyle = p.color

      if (p.debris) {
        // 三角形碎片
        const s = p.size
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(p.rot)
        ctx.beginPath()
        ctx.moveTo(0, -s)
        ctx.lineTo(s, s)
        ctx.lineTo(-s, s)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      } else {
        // 小圆点
        const s = Math.max(1, Math.round(p.size))
        ctx.fillRect(x - s / 2, y - s / 2, s, s)
      }
    }
    ctx.globalAlpha = 1
  }

  /** 清空全部粒子（resetWorld 时调用） */
  clear(): void {
    this.list.length = 0
  }
}
