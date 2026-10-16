import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons-ng'
import path from 'node:path'
import { defineConfig } from 'vite'

// GitHub Pages 部署到 https://<user>.github.io/parkour-game-/
export default defineConfig({
  base: '/parkour-game-/',
  plugins: [
    vue(),
    tailwindcss(),
    // 本地 SVG 图标雪碧图：把 src/assets/icons 下的 svg 打包成 symbol，
    // 通过 <use href="#icon-名称"> 引用；从 iconfont.cn 下载的同名 svg 直接替换即可生效
    createSvgIconsPlugin({
      iconDirs: [path.resolve(process.cwd(), 'src/assets/icons')],
      symbolId: 'icon-[name]',
    }),
  ],
  server: {
    host: '0.0.0.0',
  },
})
