import type { Rect } from './types'

/** AABB 碰撞检测：两矩形重叠返回 true */
export function aabb(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  )
}

/** [min, max) 范围内的随机整数 */
export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min
}

/** [min, max] 范围内的随机浮点数 */
export function randRange(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

/** 常用颜色常量 */
export const COLORS = {
  skyTop: '#87CEEB',
  skyBottom: '#E0F6FF',
  ground: '#8B4513',
  groundGrass: '#228B22',
  player: '#FF6B6B',
  playerEye: '#FFFFFF',
  obstacleBox: '#654321',
  obstacleSpike: '#2F2F2F',
  obstacleBird: '#4A4A4A',
}
