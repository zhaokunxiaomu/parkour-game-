import type { GameConfig, GameState, GameCallbacks } from './types'
import { Player } from './Player'
import { ObstaclePool, type ObstacleType } from './Obstacle'
import { Ground } from './Ground'
import { aabb, randInt } from './utils'

export type { GameConfig, GameState, GameCallbacks } from './types'

/** 默认配置 */
export const DEFAULT_CONFIG: GameConfig = {
  canvasWidth: 900,
  canvasHeight: 300,
  groundY: 240,
  gravity: 0.6,
  jumpVelocity: -13,
  baseSpeed: 5,
  maxSpeed: 14,
  speedIncrement: 0.0008, // 每帧增加（帧 ≈ 16.7ms）
  minObstacleGap: 220,
  maxObstacleGap: 500,
}

export class Game {
  private ctx: CanvasRenderingContext2D
  private config: GameConfig
  private callbacks: GameCallbacks

  private player: Player
  private obstacles: ObstaclePool
  private ground: Ground

  private state: GameState = 'menu'
  private score = 0
  private speed: number

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
    this.ground = new Ground(this.config)
    this.speed = this.config.baseSpeed
  }

  /** 启动主循环（菜单/游戏都在跑，只是逻辑分支不同） */
  mount(): void {
    if (this.running) return
    this.running = true
    this.lastTs = performance.now()
    this.loop(this.lastTs)
  }

  /** 停止主循环（组件卸载时调用） */
  unmount(): void {
    this.running = false
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  /** 外部触发：开始游戏 */
  start(): void {
    this.resetWorld()
    this.state = 'playing'
    this.emitState()
  }

  /** 外部触发：跳跃（菜单/结束状态时相当于开始） */
  jump(): void {
    if (this.state === 'playing') {
      this.player.jump()
    } else {
      this.start()
      this.player.jump()
    }
  }

  /** 当前游戏状态 */
  getState(): GameState {
    return this.state
  }

  /** 当前分数 */
  getScore(): number {
    return this.score
  }

  // ---------- 内部 ----------

  private resetWorld(): void {
    this.player.reset()
    this.obstacles.reset()
    this.ground.reset()
    this.score = 0
    this.speed = this.config.baseSpeed
  }

  private emitState(): void {
    this.callbacks.onStateChange?.(this.state)
  }

  private loop = (ts: number) => {
    if (!this.running) return
    const rawDt = ts - this.lastTs
    this.lastTs = ts
    // dt 归一化到"帧"单位（1帧 ≈ 16.67ms），保证不同帧率下物理一致
    // 同时限制 dt 防止 Tab 切回来时巨跳
    const dt = Math.min(rawDt / 16.6667, 3)

    this.update(dt)
    this.render()

    this.rafId = requestAnimationFrame(this.loop)
  }

  private update(dt: number): void {
    // 菜单/结束状态下只滚动背景，不推进游戏
    if (this.state === 'playing') {
      // 加速
      this.speed = Math.min(
        this.speed + this.config.speedIncrement * dt,
        this.config.maxSpeed
      )

      // 分数（每前进 10px 得 1 分）
      this.score += (this.speed * dt) / 10
      this.callbacks.onScoreChange?.(Math.floor(this.score))

      this.player.update(dt)
      this.ground.update(this.speed, dt)

      // 生成 + 更新障碍物
      this.spawnIfNeeded()
      for (const ob of this.obstacles.activeList()) {
        ob.update(this.speed, dt)
      }

      // 碰撞检测
      const pBox = this.player.getHitbox()
      for (const ob of this.obstacles.activeList()) {
        if (aabb(pBox, ob.getHitbox())) {
          this.gameOver()
          break
        }
      }
    } else {
      // 菜单/结束：让地面慢速滚动，保持"活着"的感觉
      this.ground.update(2, dt)
      this.player.update(dt)
    }
  }

  private spawnIfNeeded(): void {
    // 把"世界最右端"的障碍物移到屏幕最右侧时，再生成新的
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
      ob.spawn(type, x)
    }
  }

  /** 随分数增加逐渐解锁 bird */
  private pickObstacleType(): ObstacleType {
    const s = Math.floor(this.score)
    const roll = Math.random()
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
    this.state = 'over'
    const final = Math.floor(this.score)
    this.callbacks.onGameOver?.(final)
    this.emitState()
  }

  private render(): void {
    const { ctx, config } = this
    ctx.clearRect(0, 0, config.canvasWidth, config.canvasHeight)

    this.ground.draw(ctx)

    // 障碍物（在玩家后面画，玩家压在上面）
    for (const ob of this.obstacles.activeList()) {
      ob.draw(ctx)
    }

    this.player.draw(ctx)
  }
}
