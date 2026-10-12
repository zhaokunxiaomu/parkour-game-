# 跑酷大冒险

一款基于 Vue 3 + TypeScript + Canvas 的网页跑酷小游戏。玩家控制角色在无尽跑道上跳跃、下蹲、冲刺，躲避障碍物、收集金币与道具，依次闯过 4 个主题关卡取得最终胜利。

## 特性

- **4 关线性闯关**：日间草原 → 荒漠峡谷 → 冰雪之巅 → 星空夜色，每关达到目标分数自动进入下一关
- **三种操作方式**：跳跃（空格/↑/点击）、下蹲（↓/S）、冲刺（Shift），移动端提供虚拟按钮
- **两类障碍物**：致死型（必须躲避）与可站立型（可从上方落脚），按分数阶梯渐进解锁
- **道具系统**：金币（加分）、护盾（抵挡一次伤害）、加速鞋（触发冲刺）
- **关卡介绍蒙层**：第一关手动点「开始」，后续关卡自动倒计时过渡
- **移动端横屏适配**：竖屏触摸设备优先尝试原生横屏锁定（安卓 Chrome），不支持时 CSS 旋转 90° 兜底，无需用户手动设置
- **音效系统**：WebAudio 合成音效，可开关，状态持久化
- **最高分记录**：localStorage 持久化本局最佳成绩
- **DevTools 防护**：生产构建下检测到开发者工具打开时遮罩提示（劝退级防护）

## 技术栈

| 类别   | 选型                                                                      |
| ------ | ------------------------------------------------------------------------- |
| 框架   | Vue 3（`<script setup>` SFC）                                             |
| 语言   | TypeScript                                                                |
| 构建   | Vite + vue-tsc                                                            |
| 包管理 | pnpm                                                                      |
| 渲染   | 原生 Canvas 2D（固定 900×300 逻辑分辨率，`object-fit: contain` 等比缩放） |
| 音效   | WebAudio API 合成                                                         |
| 防护   | disable-devtool                                                           |

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 类型检查 + 生产构建
pnpm build

# 本地预览生产构建
pnpm preview
```

## 项目结构

```
src/
├── game/                  # 游戏引擎（纯 TS，不依赖 Vue，可独立复用）
│   ├── index.ts           # 引擎主类：主循环、碰撞、关卡流程、对外 API
│   ├── Player.ts          # 玩家角色：跳跃/二段跳/下蹲/冲刺状态机
│   ├── Obstacle.ts        # 障碍物：类型定义与生成规则
│   ├── Pickup.ts          # 道具（金币/护盾/加速鞋）与对象池
│   ├── Ground.ts          # 地面与可站立平台
│   ├── ParticleSystem.ts  # 粒子特效
│   ├── Audio.ts           # WebAudio 合成音效
│   ├── utils.ts           # 关卡配置 LEVELS、主题色 THEMES、工具函数
│   └── types.ts           # 全局类型与 GameConfig 配置对象
├── components/            # Vue UI 组件（蒙层、HUD、虚拟按钮）
│   ├── GameCanvas.vue     # 画布容器，桥接引擎与 Vue 层
│   ├── StartScreen.vue    # 主菜单
│   ├── LevelTransition.vue# 关卡介绍/过渡蒙层
│   ├── ScoreHUD.vue       # 分数显示
│   ├── PauseScreen.vue    # 暂停界面
│   ├── GameOverScreen.vue # 失败界面
│   └── VictoryScreen.vue  # 通关胜利界面
├── utils/
│   └── devtoolsGuard.ts   # disable-devtool 封装（仅生产构建启用）
├── App.vue                # 外围 UI 状态管理、输入分发、横屏适配
└── main.ts                # 应用入口
```

## 架构约定

- **引擎与 UI 分层**：`src/game/` 为纯 TypeScript 引擎，通过回调接口与 Vue 层通信，不依赖任何 Vue API 或 DOM 操作
- **对象池**：障碍物、道具、粒子统一池化管理，避免 GC 卡顿
- **集中配置**：可调参数集中在 `GameConfig`，关卡与主题在 `utils.ts` 中定义
- **整数像素渲染**：背景 tile 与实体绘制均对齐整数坐标，避免亚像素灰缝与抖动
- **开闭原则**：新增功能优先新建文件，不改动核心循环

## 游戏参数

| 关卡 | 主题     | 目标分数 |
| ---- | -------- | -------- |
| 1    | 日间草原 | 500      |
| 2    | 荒漠峡谷 | 1200     |
| 3    | 冰雪之巅 | 2500     |
| 4    | 星空夜色 | 5000     |

得分来源：存活时间（随速度递增）+ 金币（每个 +20）。

## 已知限制

- disable-devtool 为劝退级防护，无法真正隐藏前端源码
- iOS Safari 不支持 `screen.orientation.lock`，竖屏时走 CSS 旋转兜底方案
