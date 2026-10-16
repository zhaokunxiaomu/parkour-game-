<script setup lang="ts">
/**
 * 通用 SVG 图标组件：引用 vite-plugin-svg-icons-ng 生成的雪碧图 symbol。
 * name 对应 src/assets/icons/ 下的文件名（不含 .svg），即 #icon-[name]。
 * 颜色自动继承父级 color（图标内均为 fill="currentColor"）；
 * 不传 size 时默认 1em 跟随字号，传 size 则以 px 固定尺寸。
 */
import { computed } from 'vue'

const props = defineProps<{
  name: string
  size?: number
}>()

const sizeStyle = computed(() =>
  props.size
    ? { width: `${props.size}px`, height: `${props.size}px` }
    : undefined,
)
</script>

<template>
  <svg class="svg-icon" :style="sizeStyle" aria-hidden="true" focusable="false">
    <use :href="`#icon-${name}`" />
  </svg>
</template>

<style scoped>
.svg-icon {
  width: 1em;
  height: 1em;
  fill: currentColor;
  vertical-align: -0.125em;
  overflow: hidden;
}
</style>
