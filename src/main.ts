import { createApp } from 'vue'
import { setupDevtoolsGuard } from './utils/devtoolsGuard'
import './style.css'
import App from './App.vue'

// 生产构建下启用 DevTools 检测；开发模式可用 ?guard=1 临时开启便于验证
if (import.meta.env.PROD || location.search.includes('guard=1')) {
  setupDevtoolsGuard()
}

createApp(App).mount('#app')

// Vue 挂载完成后淡出移除首屏 loading 骨架
const boot = document.getElementById('boot-loading')
if (boot) {
  boot.style.opacity = '0'
  boot.addEventListener('transitionend', () => boot.remove(), { once: true })
  // 兜底：某些环境不触发 transitionend
  setTimeout(() => boot.remove(), 600)
}
