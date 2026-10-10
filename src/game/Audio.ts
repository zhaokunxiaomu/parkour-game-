/**
 * 简易音效系统 —— 用 Web Audio API 纯代码合成音效
 * 好处：不需要加载任何 mp3/wav 文件，项目保持零二进制资源依赖
 * 调用时机：用户首次交互（click / keydown）后调用 init() 创建 AudioContext
 */
export class Audio {
  private ctx: AudioContext | null = null
  private enabled = true

  /** 用户首次交互后必须调一次，否则浏览器会阻止 AudioContext 创建 */
  init(): void {
    if (this.ctx) return
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AC = window.AudioContext || (window as any).webkitAudioContext
      this.ctx = new AC()
    } catch {
      this.ctx = null
    }
  }

  /** 开启 / 关闭 */
  setEnabled(v: boolean): void {
    this.enabled = v
  }

  isEnabled(): boolean {
    return this.enabled
  }

  private ensureRunning(): boolean {
    if (!this.enabled || !this.ctx) return false
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return true
  }

  // ---------- 具体音效 ----------

  /** 跳跃 —— 400→800Hz 短滑升 */
  jump(): void {
    if (!this.ensureRunning()) return
    const ctx = this.ctx!
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(380, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(760, ctx.currentTime + 0.12)
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.2)
  }

  /** 撞击 —— 低频噪音 */
  hit(): void {
    if (!this.ensureRunning()) return
    const ctx = this.ctx!
    const bufferSize = ctx.sampleRate * 0.3
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
    }
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 300
    noise.connect(filter).connect(gain).connect(ctx.destination)
    noise.start()
    noise.stop(ctx.currentTime + 0.35)

    // 叠加一个低频"砰"
    const osc = ctx.createOscillator()
    const og = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(180, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.2)
    og.gain.setValueAtTime(0.35, ctx.currentTime)
    og.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
    osc.connect(og).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.3)
  }

  /** 过关 —— 上行三连音 */
  levelUp(): void {
    if (!this.ensureRunning()) return
    const ctx = this.ctx!
    const notes = [523, 659, 784] // C5 E5 G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12)
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12)
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.12 + 0.02)
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + i * 0.12 + 0.25
      )
      osc.connect(gain).connect(ctx.destination)
      osc.start(ctx.currentTime + i * 0.12)
      osc.stop(ctx.currentTime + i * 0.12 + 0.3)
    })
  }

  /** 胜利 —— 下行大和弦 */
  victory(): void {
    if (!this.ensureRunning()) return
    const ctx = this.ctx!
    const chord = [262, 330, 392, 523] // C E G C（低八度）
    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1)
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1)
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + i * 0.1 + 0.05)
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + i * 0.1 + 0.8
      )
      osc.connect(gain).connect(ctx.destination)
      osc.start(ctx.currentTime + i * 0.1)
      osc.stop(ctx.currentTime + i * 0.1 + 0.9)
    })
  }

  /** 收集金币 —— 双音短叮 */
  coin(): void {
    if (!this.ensureRunning()) return
    const ctx = this.ctx!
    const notes = [880, 1320] // A5 → E6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.05)
      gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.05)
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + i * 0.05 + 0.12
      )
      osc.connect(gain).connect(ctx.destination)
      osc.start(ctx.currentTime + i * 0.05)
      osc.stop(ctx.currentTime + i * 0.05 + 0.15)
    })
  }

  /** 获得护盾 —— 上行三音 */
  shieldGet(): void {
    if (!this.ensureRunning()) return
    const ctx = this.ctx!
    const notes = [440, 554, 659] // A4 C#5 E5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.06)
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.06)
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.06 + 0.03)
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + i * 0.06 + 0.18
      )
      osc.connect(gain).connect(ctx.destination)
      osc.start(ctx.currentTime + i * 0.06)
      osc.stop(ctx.currentTime + i * 0.06 + 0.2)
    })
  }

  /** 护盾被撞消耗 —— 低频金属冲击 */
  shieldHit(): void {
    if (!this.ensureRunning()) return
    const ctx = this.ctx!
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(300, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.18)
    gain.gain.setValueAtTime(0.22, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.25)
  }

  /** 冲刺 —— 高频嗖声快速下滑 */
  dash(): void {
    if (!this.ensureRunning()) return
    const ctx = this.ctx!
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(900, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.2)
    gain.gain.setValueAtTime(0.12, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.25)
  }
}

/** 单例导出 */
export const sfx = new Audio()
