import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// GitHub Pages 部署到 https://<user>.github.io/parkour-game-/
export default defineConfig({
  base: '/parkour-game-/',
  plugins: [vue()],
})
