# App.vue 拆分实施方案

## Context

`src/App.vue` 已膨胀到 888 行（script L1-384、template L386-537、scoped style L539-863），混杂了游戏状态机、引擎回调接线、键盘/触摸输入、移动端全屏与横屏兜底、倒计时/延迟弹窗等 UI 时序逻辑。目标：按项目"开闭原则，新增功能优先新建独立文件"约定，把 App.vue 拆到约 330 行（script ~90 / template ~130 / style ~110），行为零变化。

约束：
- `src/game/` 引擎与 `GameCanvas.vue` 全程零改动
- tsconfig 开启 `noUnusedLocals/noUnusedParameters/erasableSyntaxOnly`（新 .ts 禁用 enum/参数属性）
- 每步 `pnpm build`（含 vue-tsc）验证

## 行为红线（不可变）

1. 暂停仅「继续」按钮恢复（P/Esc/空格在 paused 无效）；点继续后 3 秒倒计时才真正 resume
2. 死亡 0.6s 延迟后才弹结算卡；失败/胜利态键盘不可重开
3. 返回主菜单复位第 1 关草原主题；过渡蒙层"下一关"由 UI 层计算（levelIndex+1）
4. 首手势前不得调用 requestFullscreen；首手势监听仅生效一次
5. 移动端虚拟按钮左蹲+冲刺、右大跳跃；桌面隐藏虚拟按钮、移动端隐藏键盘提示
6. 引导未看完时点开始只弹 TutorialOverlay 不开跑

## 新建文件

### src/composables/types.ts（~25 行）
```ts
export interface GameCanvasHandle {
  start(): void; beginPlay(): void; isIntroPending(): boolean
  pause(): void; resume(): void; restart(): void; returnToMenu(): void
  jump(): void; crouch(on: boolean): void; dash(): void
  setSfxEnabled(v: boolean): void; resumeLoop(): void
  getLevelProgress(): { current: number; target: number; ratio: number }
}
export interface FloatText { id: number; type: PickupType; text: string }
```
App 端 `const gameCanvasRef = ref<GameCanvasHandle | null>(null)`，靠 vue-tsc 模板 ref 可赋值性校验兜底，不用 `as` 断言（规避 Ref 不变性报错）。

### src/composables/useGameSession.ts（~150 行，迁移 L21-31、37-40、96-103、105-119、124-129、184-190、252-337）
- 入参：`{ canvas: Ref<GameCanvasHandle|null>, ensureFullscreen: () => void }`
- 持有：state/score/best/levelIndex/currentLevel/progressRatio/introPending/sfxEnabled/tutorialSeen/showTutorial/floatTexts/isShielded
- 导出：引擎回调（onScore/onState/onGameOver/onLevelChange/onPickup/onVictory）、动作（handleStart/handleRestart/handleBeginPlay/handleBackToMenu/handleTutorialDone/openTutorialFromHelp/toggleSfx）、pauseGame
- 内部：localStorage 三键（parkour-best-score / parkour-sfx-enabled / parkour-tutorial-seen）读写、progressTicker（100ms setInterval 轮询 getLevelProgress）+ watch(state) 启停、onPickup 1200ms 飘字清理、护盾/冲刺互斥
- startGame/handleRestart/handleBeginPlay 保持原顺序：isShielded 复位 → ensureFullscreen() → canvas 方法

### src/composables/useResumeCountdown.ts（~35 行，迁移 L33-35、229-251）
- 入参：`onFinish: () => void`（App 传 `() => canvas.resume()`）
- 导出：`resumeCountdown: Ref<number|null>`、`start()`、`stop()`
- onBeforeUnmount 清 interval（安全补强）

### src/composables/useMobileFullscreen.ts（~90 行，迁移 L42-94、121-150 首手势段、152-170、181）
- 入参：`{ onRecover: () => void }`（App 传 `() => canvas.resumeLoop()`）
- 导出：`isPortraitTouch`、`tryFullscreen`、`tryLockLandscape`、`ensureFullscreen`
- 注册时机严格照原样：viewport/orientation/resize 监听在 setup 期；visibilitychange/pageshow/focus 与首手势 capture 三件套（click/touchstart/keydown, capture=true）在 onMounted；removeEventListener 与 add 逐行配对含 capture 参数

### src/composables/useKeyboardControls.ts（~45 行，迁移 L192-215 + L131-132/L173-174）
- 入参：`{ getState, onJump, onPause, onCrouch, onDash }`
- 保留分支语义：仅 playing 响应空格跳/P 暂停；paused 下任何键不恢复；↓/S 按住下蹲 keyup 复位

### src/composables/useOverlayVisibility.ts（~55 行，迁移 L339-380）
- 入参：`{ state, resumeCountdown, introPending, levelIndex }`
- 导出全部 show* computed；showOver 的 0.6s 延迟 watch 在此，onBeforeUnmount 清 timer
- transitionLevelIndex 保持 `isIntroTransition ? levelIndex : levelIndex+1`

### 新组件（纯 template/style 搬移，零逻辑）
| 组件 | 模板来源 | 样式来源 | 接口 |
|---|---|---|---|
| ResumeCountdown.vue | L517-519 | L587-628（含 @keyframes pop） | props: count；根元素 @click.stop |
| LevelInfoBar.vue | L425-437 | L683-724 | props: level, ratio；v-if 条件留 App |
| FloatTextLayer.vue | L446-455 | L750-787 | props: items；TransitionGroup 与 .float-* 动画类必须同文件 |
| MobileVirtualControls.vue | L457-491 | L789-862（含 safe-area、桌面隐藏媒体查询） | emits: crouch/dash/jump；六事件与 .prevent 修饰符原样保留 |

### App.vue 保留
- script：ref 声明、composable 组装、togglePause/handlePause（stop 倒计时+pauseGame 胶水）/handleResume/handleJump、onCanvasClick
- template：.app/.game-wrapper、GameCanvas、hint-corner、暂停按钮、ScoreHUD、shield-hud、6 个蒙层组件接线
- style：.app/.game-wrapper/**.app-rotated（绝对不可移入组件或全局）**、.hint-corner、.ctrl-btn/.pause-btn、.shield-hud
- 迁移后删除 App.vue 中同名样式选择器（scoped 下组件根元素带双 scope 属性，残留规则会静默双源生效）
- 新组件根元素禁用 `position: fixed`（会脱离 .app-rotated 旋转坐标系）
- `.levels-btn`（L675-680）为死代码，本次不动，仅标注

## 实施顺序与验证

每步跑 `pnpm build`：
1. types.ts + 4 个叶子组件搬移 → 桌面端 HUD/飘字/倒计时视觉无差
2. useResumeCountdown → 暂停→继续出现 3-2-1、倒数中画面冻结、点数字不触发跳跃
3. useMobileFullscreen → 首手势一次全屏、旋转切换 .app-rotated、后台回前台动画恢复
4. useKeyboardControls → 各键位行为；paused 下按键不恢复
5. useGameSession → 三键持久化、首开弹引导、过关显示下一关、回菜单复位草原主题
6. useOverlayVisibility → 死亡 0.6s 延迟弹卡、0.6s 内重开无残留、蒙层互斥
7. 终检：browser 全量冒烟（对照红线清单）

## 易错点

1. Ref 不变性：canvas ref 直接声明为 `GameCanvasHandle|null` 类型，勿传 `InstanceType<typeof GameCanvas>` 再转型
2. 监听器 capture 参数与注册时机错位 → 首帧闪烁/监听泄漏/重复全屏
3. TransitionGroup 动画类、@keyframes 与使用它的模板必须同组件文件，否则 scoped 哈希不匹配静默失效
