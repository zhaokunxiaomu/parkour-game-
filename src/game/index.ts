import type {
  GameConfig,
  GameState,
  GameCallbacks,
  Theme,
  Level,
  PickupType,
} from './types'
import type { ObstacleType, Obstacle } from './Obstacle'
import { Player } from './Player'
import { ObstaclePool } from './Obstacle'
import { Ground } from './Ground'
import { PickupPool } from './Pickup'
import { aabb, randInt, LEVELS } from './utils'
import { sfx } from './Audio'

export type {
  GameConfig,
  GameState,
  GameCallbacks,
  Theme,
  Level,
  PickupType,
} from './types'
export { LEVELS } from './utils'

/** 默认配置 */
export const DEFAULT_CONFIG: GameConfig = {
  canvasWidth: 900,
  canvasHeight: 300,
  groundY: 240,
  gravity: 0.6,
  jumpVelocity: -13,
  baseSpeed: 5,
  maxSpeed: 14,
  speedIncrement: 0.0008,
  minObstacleGap: 220,
  maxObstacleGap: 500,
}

/** 过渡动画时长（帧单位，每帧 ≈ 16.67ms，240 帧 ≈ 4 秒） */
const TRANSITION_FRAMES = 240

export class Game {
  private ctx: CanvasRenderingContext2D
  private config: GameConfig
  private callbacks: GameCallbacks

  private player: Player
  private obstacles: ObstaclePool
  private pickups: PickupPool
  private ground: Ground

  private state: GameState = 'menu'
  private score = 0
  private speed: number

  /** 关卡系统 */
  private levelIndex = 0
  private transitionFrames = 0 // transition 倒计时

  /** 帧控制 */
  private rafId: number | null = null
  private lastTs = 0
  private running = false

  constructor(
    canvas: HTMLCanvasElement,
    callbacks: GameCallbacks = {},
    config: Partial<GameConfig> = {}
  ) {
    this.ctx = canvas.getContext('2d')!
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.callbacks = callbacks

    canvas.width = this.config.canvasWidth
    canvas.height = this.config.canvasHeight

    this.player = new Player(this.config)
    this.obstacles = new ObstaclePool(this.config)
    this.pickups = new PickupPool(this.config)
    this.ground = new Ground(this.config, 'day')
    this.speed = this.config.baseSpeed
  }

  mount(): void {
    if (this.running) return
    this.running = true
    this.lastTs = performance.now()
    this.loop(this.lastTs)
  }

  unmount(): void {
    this.running = false
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  // ---------- 外部公开方法 ----------

  start(): void {
    sfx.init() // 用户首次交互后创建 AudioContext
    this.resetWorld()
    this.levelIndex = 0
    this.applyLevelTheme()
    this.state = 'playing'
    this.emitState()
    this.emitLevelChange()
  }

  pause(): void {
    if (this.state !== 'playing') return
    this.state = 'paused'
    this.emitState()
  }

  resume(): void {
    if (this.state !== 'paused') return
    this.state = 'playing'
    this.lastTs = performance.now() // 防 dt 巨跳
    this.emitState()
  }

  restart(): void {
    this.start()
  }

  jump(): void {
    if (this.state === 'playing') {
      if (this.player.jump()) sfx.jump()
    } else if (this.state === 'menu') {
      sfx.init()
      this.start()
      this.player.jump()
      sfx.jump()
    } else if (this.state === 'over') {
      this.restart()
    } else if (this.state === 'victory') {
      this.restart()
    }
  }

  /** 下蹲（按住 = on=true，松开 = on=false，持续状态） */
  crouch(on: boolean): void {
    if (this.state !== 'playing') return
    this.player.crouch(on)
  }

  /** 冲刺（按下瞬间触发，限时持续） */
  dash(): void {
    if (this.state !== 'playing') return
    if (this.player.tryDash()) {
      sfx.dash()
    }
  }

  /** 切到指定关卡（供外部关卡选择器调用） */
  gotoLevel(index: number): void {
    const clamped = Math.max(0, Math.min(index, LEVELS.length - 1))
    this.resetWorld()
    this.levelIndex = clamped
    this.applyLevelTheme()
    this.state = 'playing'
    this.emitState()
    this.emitLevelChange()
  }

  getState(): GameState {
    return this.state
  }

  getScore(): number {
    return this.score
  }

  getLevelIndex(): number {
    return this.levelIndex
  }

  getCurrentLevel(): Level {
    return LEVELS[this.levelIndex]
  }

  getLevelProgress(): { current: number; target: number; ratio: number } {
    const cur = Math.floor(this.score)
    const target = this.getCurrentLevel().targetScore
    return { current: cur, target, ratio: Math.min(1, cur / target) }
  }

  setSfxEnabled(v: boolean): void {
    sfx.setEnabled(v)
  }

  isSfxEnabled(): boolean {
    return sfx.isEnabled()
  }

  // ---------- 内部 ----------

  private applyLevelTheme(): void {
    const theme: Theme = LEVELS[this.levelIndex].theme
    this.ground.setTheme(theme)
    this.player.setTheme(theme)
    this.obstacles.setTheme(theme)
    this.pickups.setTheme(theme)
  }

  private resetWorld(): void {
    this.player.reset()
    this.obstacles.reset()
    this.pickups.reset()
    this.ground.reset()
    this.score = 0
    this.speed = this.config.baseSpeed
  }

  private emitState(): void {
    this.callbacks.onStateChange?.(this.state)
  }

  private emitLevelChange(): void {
    this.callbacks.onLevelChange?.(this.levelIndex, LEVELS[this.levelIndex])
  }

  private loop = (ts: number) => {
    if (!this.running) return
    const rawDt = ts - this.lastTs
    this.lastTs = ts
    const dt = Math.min(rawDt / 16.6667, 3)

    this.update(dt)
    this.render()

    this.rafId = requestAnimationFrame(this.loop)
  }

  private update(dt: number): void {
    if (this.state === 'playing') {
      // 加速
      this.speed = Math.min(
        this.speed + this.config.speedIncrement * dt,
        this.config.maxSpeed
      )

      // 冲刺：视觉速度 × DASH_SPEED_MULT，但基础 speed 不变（冲刺结束后速度曲线连续）
      const renderSpeed = this.speed * (this.player.isDashingNow() ? this.player.DASH_SPEED_MULT : 1)

      // 分数（用基础 speed，冲刺不额外刷分）
      this.score += (this.speed * dt) / 10
      this.callbacks.onScoreChange?.(Math.floor(this.score))

      this.player.update(dt)
      this.ground.update(renderSpeed, dt)

      // 障碍物
      this.spawnIfNeeded()
      for (const ob of this.obstacles.activeList()) {
        ob.update(renderSpeed, dt)
      }

      // 道具
      this.spawnPickupsIfNeeded()
      for (const p of this.pickups.activeList()) {
        p.update(renderSpeed, dt)
      }

      // 平台站立检测
      this.checkPlatformStanding()

      // 道具收集（先检查，dash 时也能捡）
      const pBox = this.player.getHitbox()
      for (const pk of this.pickups.activeList()) {
        if (aabb(pBox, pk.getHitbox())) {
          this.collectPickup(pk.type)
          pk.active = false
        }
      }

      // obstacle 碰撞（deadly 类型）
      // dash 中玩家无敌（穿越障碍），不用 shield 挡
      if (!this.player.isDashingNow()) {
        for (const ob of this.obstacles.activeList()) {
          if (ob.category === 'deadly' && aabb(pBox, ob.getHitbox())) {
            if (this.player.consumeShield()) {
              // 护盾消耗一次，免死
              sfx.shieldHit()
            } else {
              this.gameOver()
              return
            }
          }
        }
      }

      // 检查过关
      const level = LEVELS[this.levelIndex]
      if (Math.floor(this.score) >= level.targetScore) {
        if (this.levelIndex >= LEVELS.length - 1) {
          this.victory()
        } else {
          this.startLevelTransition()
        }
      }
    } else if (this.state === 'transition') {
      this.transitionFrames -= dt
      this.ground.update(1, dt)
      if (this.transitionFrames <= 0) {
        this.advanceLevel()
      }
    } else if (this.state === 'menu') {
      this.ground.update(2, dt)
      this.player.update(dt)
    }
    // paused / over / victory：完全冻结
  }

  private checkPlatformStanding(): void {
    let standingOnOb: Obstacle | null = null
    const pBox = this.player.getHitbox()
    const playerBottom = this.player.getBottomY()

    for (const ob of this.obstacles.activeList()) {
      if (!ob.isStandable()) continue
      // 玩家之前在空中 + 脚刚好在 platform 顶部 + 水平重叠
      if (
        playerBottom >= ob.getTopY() - 2 &&
        playerBottom <= ob.getTopY() + 8 &&
        pBox.x + pBox.w > ob.x + 4 &&
        pBox.x < ob.x + ob.w - 4 &&
        this.player.vy >= 0 // 只有下落时才能站上去
      ) {
        standingOnOb = ob
        break
      }
    }
    this.player.setStandingOn(standingOnOb)
  }

  private startLevelTransition(): void {
    sfx.levelUp()
    this.state = 'transition'
    this.transitionFrames = TRANSITION_FRAMES
    this.emitState()
  }

  private advanceLevel(): void {
    this.levelIndex++
    this.obstacles.reset()
    this.pickups.reset()
    this.score = 0
    this.speed = this.config.baseSpeed
    this.player.reset()
    this.applyLevelTheme()
    this.state = 'playing'
    this.emitState()
    this.emitLevelChange()
  }

  private spawnIfNeeded(): void {
    const rightmost = this.obstacles
      .activeList()
      .reduce((max, o) => Math.max(max, o.x + o.w), 0)

    if (rightmost < this.config.canvasWidth) {
      const type = this.pickObstacleType()
      const gap = randInt(
        this.config.minObstacleGap,
        this.config.maxObstacleGap
      )
      const x = Math.max(this.config.canvasWidth + 40, rightmost + gap)
      const ob = this.obstacles.acquire()
      ob.setTheme(LEVELS[this.levelIndex].theme)
      ob.spawn(type, x)
    }
  }

  /** 道具生成：不每次都刷，有一定概率在屏幕右侧刷出（金币概率最高） */
  private spawnPickupsIfNeeded(): void {
    // 不超过 3 个同时存在
    if (this.pickups.activeList().length >= 3) return

    const rightmost = Math.max(
      this.obstacles
        .activeList()
        .reduce((max, o) => Math.max(max, o.x + o.w), 0),
      this.pickups
        .activeList()
        .reduce((max, p) => Math.max(max, p.x + p.w), 0)
    )

    // 有概率生成（不是每帧，避免太密集）
    if (rightmost < this.config.canvasWidth && Math.random() < 0.015) {
      const roll = Math.random()
      const type: PickupType =
        roll < 0.7 ? 'coin' : roll < 0.9 ? 'shield' : 'boost'
      const gap = randInt(200, 450)
      const x = Math.max(this.config.canvasWidth + 30, rightmost + gap)
      const pk = this.pickups.acquire()
      pk.setTheme(LEVELS[this.levelIndex].theme)
      pk.spawn(type, x)
    }
  }

  /** 收集道具 → 执行效果 + 回调 */
  private collectPickup(type: PickupType): void {
    if (type === 'coin') {
      this.score += 20   // 金币 +20 分
      sfx.coin()
    } else if (type === 'shield') {
      this.player.giveShield()
      sfx.shieldGet()
    } else if (type === 'boost') {
      // 加速鞋 = 立即触发一次 dash（玩家没 dash 也能穿）
      this.player.tryDash()
      sfx.dash()
    }
    this.callbacks.onPickup?.(type)
  }

  private pickObstacleType(): ObstacleType {
    const s = Math.floor(this.score)
    const roll = Math.random()
    const theme = LEVELS[this.levelIndex].theme

    // 冰雪主题更容易刷 roller / flySpike
    if (theme === 'snow') {
      if (s < 150) {
        if (roll < 0.35) return 'box'
        if (roll < 0.7) return 'spike'
        if (roll < 0.85) return 'roller'
        return 'bird'
      } else {
        if (roll < 0.25) return 'box'
        if (roll < 0.5) return 'spike'
        if (roll < 0.7) return 'flySpike'
        if (roll < 0.85) return 'roller'
        return 'bird'
      }
    }
    // 沙漠主题更容易刷 roller
    if (theme === 'desert') {
      if (roll < 0.3) return 'box'
      if (roll < 0.55) return 'spike'
      if (roll < 0.75) return 'roller'
      return 'bird'
    }
    // 夜空主题更危险
    if (theme === 'night') {
      if (roll < 0.2) return 'box'
      if (roll < 0.45) return 'spike'
      if (roll < 0.6) return 'flySpike'
      if (roll < 0.75) return 'platform'
      return 'bird'
    }
    // day：默认
    if (s < 100) {
      return roll < 0.6 ? 'box' : 'spike'
    } else if (s < 300) {
      if (roll < 0.45) return 'box'
      if (roll < 0.85) return 'spike'
      return 'bird'
    } else {
      if (roll < 0.35) return 'box'
      if (roll < 0.65) return 'spike'
      return 'bird'
    }
  }

  private gameOver(): void {
    if (this.state !== 'playing') return
    sfx.hit()
    this.state = 'over'
    const final = Math.floor(this.score)
    this.callbacks.onGameOver?.(final)
    this.emitState()
  }

  private victory(): void {
    if (this.state !== 'playing') return
    sfx.victory()
    this.state = 'victory'
    this.callbacks.onVictory?.()
    this.emitState()
  }

  private render(): void {
    const { ctx, config } = this
    ctx.clearRect(0, 0, config.canvasWidth, config.canvasHeight)

    this.ground.draw(ctx)
    // 道具在障碍物后面画（视觉上道具更靠天空层）
    for (const p of this.pickups.activeList()) {
      p.draw(ctx)
    }
    for (const ob of this.obstacles.activeList()) {
      ob.draw(ctx)
    }
    this.player.draw(ctx)
  }
}
