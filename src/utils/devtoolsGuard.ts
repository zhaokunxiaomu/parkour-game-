import disableDevtool from 'disable-devtool'

/**
 * DevTools 防护（劝退级）：检测到开发者工具打开时遮罩页面并提示。
 * 仅应在生产构建下调用，开发模式不启用以免干扰调试。
 */
export function setupDevtoolsGuard(): void {
  disableDevtool({
    // 检测到 DevTools 打开时：遮罩页面并提示（提供回调后库不再执行默认跳转/关窗）
    ondevtoolopen: () => {
      if (document.getElementById('devtool-mask')) return
      const mask = document.createElement('div')
      mask.id = 'devtool-mask'
      mask.style.cssText =
        'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;' +
        'flex-direction:column;gap:12px;background:#1e2a38;color:#fff;font-size:16px;'
      mask.innerHTML =
        '<div style="font-size:20px;font-weight:700;letter-spacing:2px">页面已受保护</div>' +
        '<div>检测到开发者工具已打开</div>' +
        '<div style="font-size:13px;opacity:.7">请关闭 DevTools 后刷新页面继续游戏</div>'
      document.body.appendChild(mask)
    },
  })
}
