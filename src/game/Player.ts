import type { GameConfig, Rect, Theme } from './types'
import { THEMES } from './utils'
import type { Obstacle } from './Obstacle'

export class Player {
  /** 基础尺寸 */
  readonly baseW = 40
  readonly baseH = 50
  x: number
  y: number
  w = 40
  h = 50
  vy = 0
  onGround = true

  /** 当前站在哪个可站立障碍物上（platform），null = 不在上面 */
  private standingOn: Obstacle | null = null

  private groundY: number
  private gravity: number
  private jumpVelocity: number

  /** 动画计时 */
  private frameTimer = 0
  private runFrame = 0
  private theme: Theme = 'day'

  // ===== 能力状态 =====

  /** 二段跳：空中还能再跳一次 */
  private canDoubleJump = true

  /** 下蹲（按住下方向键 / S） */
  private isCrouching = false

  /** 冲刺（Shift）：限时高速 + 无敌 */
  private isDashing = false
  private dashTimer = 0 // 当前冲刺剩余时间（帧）
  private readonly DASH_DURATION = 24 // 持续约 0.4s
  private readonly DASH_COOLDOWN = 60 // 冷却约 1s
  private dashCooldown = 0
  /** 冲刺速度倍率（提供给 Game 引擎参考） */
  readonly DASH_SPEED_MULT = 1.8

  /** 护盾（道具效果）：挡住一次伤害 */
  private hasShield = false

  constructor(config: GameConfig) {
    this.x = config.canvasWidth * 0.2
    this.groundY = config.groundY
    this.gravity = config.gravity
    this.jumpVelocity = config.jumpVelocity
    this.y = this.groundY - this.h
  }

  setTheme(theme: Theme): void {
    this.theme = theme
  }

  reset(): void {
    this.w = this.baseW
    this.h = this.baseH
    this.y = this.groundY - this.h
    this.vy = 0
    this.onGround = true
    this.standingOn = null
    this.frameTimer = 0
    this.runFrame = 0
    this.canDoubleJump = true
    this.isCrouching = false
    this.isDashing = false
    this.dashTimer = 0
    this.dashCooldown = 0
    this.hasShield = false
  }

  // ===== 跳跃（含二段跳） =====

  jump(): boolean {
    if (this.onGround) {
      this.vy = this.jumpVelocity
      this.onGround = false
      this.standingOn = null
      this.canDoubleJump = true // 刚起跳，二段跳可用
      return true
    } else if (this.canDoubleJump) {
      // 二段跳：力度略小一点
      this.vy = this.jumpVelocity * 0.85
      this.canDoubleJump = false
      return true
    }
    return false
  }

  // ===== 下蹲 =====

  crouch(on: boolean): void {
    if (this.onGround) {
      this.isCrouching = on
      this.h = on ? this.baseH * 0.6 : this.baseH
      this.y = this.groundY - this.h
    }
  }

  isCrouched(): boolean {
    return this.isCrouching
  }

  // ===== 冲刺 =====

  /** 尝试启动冲刺，返回是否成功 */
  tryDash(): boolean {
    if (this.dashCooldown > 0 || this.isDashing) return false
    this.isDashing = true
    this.dashTimer = this.DASH_DURATION
    this.dashCooldown = this.DASH_COOLDOWN
    return true
  }

  isDashingNow(): boolean {
    return this.isDashing
  }

  // ===== 护盾 =====

  giveShield(): void {
    this.hasShield = true
  }

  consumeShield(): boolean {
    if (this.hasShield) {
      this.hasShield = false
      return true // 护盾被消耗了，免于一死
    }
    return false
  }

  shieldActive(): boolean {
    return this.hasShield
  }

  // ===== platform 站立 =====

  setStandingOn(ob: Obstacle | null): boolean {
    const changed = this.standingOn !== ob
    this.standingOn = ob
    if (ob) {
      this.onGround = true
      this.canDoubleJump = true
      this.y = ob.getTopY() - this.h
      this.vy = 0
    }
    return changed
  }

  update(dt: number): void {
    // 冲刺计时
    if (this.isDashing) {
      this.dashTimer -= dt
      if (this.dashTimer <= 0) {
        this.isDashing = false
        this.dashTimer = 0
      }
    }
    if (this.dashCooldown > 0) {
      this.dashCooldown -= dt
    }

    // platform 站立或自由落体
    if (this.standingOn) {
      this.y = this.standingOn.getTopY() - this.h
      if (!this.standingOn.isStandable()) {
        // platform 变成 deadly 类型了（不应该发生，但防御）
        this.standingOn = null
        this.onGround = false
      }
    } else if (!this.onGround) {
      this.vy += this.gravity * dt
      this.y += this.vy * dt
      if (this.y >= this.groundY - this.h) {
        this.y = this.groundY - this.h
        this.vy = 0
        this.onGround = true
        this.canDoubleJump = true // 落地重置二段跳
        // 落地时恢复下蹲状态（如果地面上还按着下键，下蹲保持）
        // 注意：不主动恢复 isCrouching，由按键控制
      }
    } else {
      // 站在地上但没 platform：y 固定，二段跳可用
      this.y = this.groundY - this.h
      this.canDoubleJump = true
    }

    // 跑步动画
    this.frameTimer += dt
    if (this.frameTimer >= 6) {
      this.frameTimer = 0
      this.runFrame = (this.runFrame + 1) % 4
    }
  }

  /** 碰撞盒 */
  getHitbox(): Rect {
    return {
      x: this.x + 4,
      y: this.y + 4,
      w: this.w - 8,
      h: this.h - 8,
    }
  }

  getBottomY(): number {
    return this.y + this.h
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const x = Math.round(this.x)
    const y = Math.round(this.y)
    const c = THEMES[this.theme]

    // 冲刺残影
    if (this.isDashing) {
      ctx.globalAlpha = 0.35
      ctx.fillStyle = c.player
      ctx.fillRect(x - 12, y, this.w, this.h)
      ctx.fillRect(x - 6, y, this.w, this.h)
      ctx.globalAlpha = 1
    }

    ctx.fillStyle = c.player
    ctx.fillRect(x, y, this.w, this.h)

    // 护盾效果（半透明光环）
    if (this.hasShield) {
      ctx.strokeStyle = 'rgba(100, 200, 255, 0.85)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(
        x + this.w / 2,
        y + this.h / 2,
        Math.max(this.w, this.h) * 0.75,
        0,
        Math.PI * 2
      )
      ctx.stroke()
      ctx.fillStyle = 'rgba(100, 200, 255, 0.15)'
      ctx.beginPath()
      ctx.arc(
        x + this.w / 2,
        y + this.h / 2,
        Math.max(this.w, this.h) * 0.75,
        0,
        Math.PI * 2
      )
      ctx.fill()
    }

    // 眼睛（下蹲时位置下调）
    const eyeY = this.isCrouching ? y + 4 : y + 8
    const eyeH = this.isCrouching ? 6 : 8
    ctx.fillStyle = c.playerEye
    ctx.fillRect(x + this.w - 14, eyeY, 8, eyeH)
    ctx.fillStyle = '#000'
    ctx.fillRect(x + this.w - 10, eyeY + 2, 3, Math.min(4, eyeH - 2))

    // 腿部（冲刺时抬起 / 下蹲时缩短）
    ctx.fillStyle = '#333'
    if (this.isCrouching) {
      // 下蹲：腿很短
      ctx.fillRect(x + 8, y + this.h - 4, 8, 4)
      ctx.fillRect(x + this.w - 16, y + this.h - 4, 8, 4)
    } else if (this.isDashing) {
      // 冲刺：腿抬起前冲
      ctx.fillRect(x + 2, y + this.h, 12, 4)
      ctx.fillRect(x + this.w - 16, y + this.h - 2, 10, 6)
    } else {
      const legOffset = this.onGround ? [0, 3, 0, -3][this.runFrame] : 2
      ctx.fillRect(x + 6, y + this.h, 8, 6 + legOffset)
      ctx.fillRect(x + this.w - 14, y + this.h, 8, 6 - legOffset)
    }
  }
}
