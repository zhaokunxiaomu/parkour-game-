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

import type { Theme, Level } from './types'

/** 主题色板 —— Ground / Player / Obstacle 全部从这里取色 */
export const THEMES: Record<
  Theme,
  {
    name: string
    skyTop: string
    skyBottom: string
    farMountain: string
    midMountain: string
    grass: string
    ground: string
    groundPattern: string
    player: string
    playerEye: string
    obstacleBox: string
    obstacleSpike: string
    obstacleBird: string
    platformTop: string
    platformBody: string
    roller: string
    flySpike: string
  }
> = {
  day: {
    name: '日间草原',
    skyTop: '#87CEEB',
    skyBottom: '#E0F6FF',
    farMountain: '#9FC5E8',
    midMountain: '#6FA8DC',
    grass: '#228B22',
    ground: '#8B4513',
    groundPattern: 'rgba(0,0,0,0.15)',
    player: '#FF6B6B',
    playerEye: '#FFFFFF',
    obstacleBox: '#654321',
    obstacleSpike: '#2F2F2F',
    obstacleBird: '#4A4A4A',
    platformTop: '#E67E22',
    platformBody: '#D35400',
    roller: '#7F8C8D',
    flySpike: '#9B59B6',
  },
  desert: {
    name: '荒漠峡谷',
    skyTop: '#F4A460',
    skyBottom: '#FFD699',
    farMountain: '#CD853F',
    midMountain: '#B8860B',
    grass: '#DAA520',
    ground: '#C19A6B',
    groundPattern: 'rgba(101,67,33,0.25)',
    player: '#E74C3C',
    playerEye: '#FFFFFF',
    obstacleBox: '#8B4513',
    obstacleSpike: '#6B4226',
    obstacleBird: '#5D4037',
    platformTop: '#D2691E',
    platformBody: '#A0522D',
    roller: '#8B7355',
    flySpike: '#4A2C2A',
  },
  snow: {
    name: '冰雪之巅',
    skyTop: '#B0E0E6',
    skyBottom: '#E0FFFF',
    farMountain: '#D3D3D3',
    midMountain: '#A9A9A9',
    grass: '#F0F8FF',
    ground: '#FFFAFA',
    groundPattern: 'rgba(150,180,200,0.3)',
    player: '#4169E1',
    playerEye: '#FFFFFF',
    obstacleBox: '#708090',
    obstacleSpike: '#4682B4',
    obstacleBird: '#778899',
    platformTop: '#A8C8E0',
    platformBody: '#5F9EA0',
    roller: '#B0C4DE',
    flySpike: '#6495ED',
  },
  night: {
    name: '星空夜色',
    skyTop: '#0B0C2A',
    skyBottom: '#1E1F4A',
    farMountain: '#2C3E50',
    midMountain: '#1B2631',
    grass: '#145A32',
    ground: '#1C2833',
    groundPattern: 'rgba(255,255,255,0.12)',
    player: '#FFD93D',
    playerEye: '#FFFFFF',
    obstacleBox: '#5D4037',
    obstacleSpike: '#34495E',
    obstacleBird: '#2C3E50',
    platformTop: '#5D6D7E',
    platformBody: '#2C3E50',
    roller: '#5D6D7E',
    flySpike: '#8E44AD',
  },
}

/** 关卡序列 —— 每关一个主题 + 目标分数 */
export const LEVELS: Level[] = [
  {
    theme: 'day',
    targetScore: 200,
    name: '日间草原',
    description: '晴朗的草原上，热身出发吧！',
  },
  {
    theme: 'desert',
    targetScore: 400,
    name: '荒漠峡谷',
    description: '烈日炎炎，小心滚石和仙人掌。',
  },
  {
    theme: 'snow',
    targetScore: 600,
    name: '冰雪之巅',
    description: '天寒地冻，尖刺和飞鸟更加凶猛。',
  },
  {
    theme: 'night',
    targetScore: 2000,
    name: '星空夜色',
    description: '终极挑战，坚持到底成为跑酷之王！',
  },
]
