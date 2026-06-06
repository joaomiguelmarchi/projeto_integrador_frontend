<template>
  <div :class="containerClass">
    <img :src="logoUrl" alt="SMILEHUB Logo" :class="logoClass">
    <span :class="textClass">SMILEHUB</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import logoBlue from '../../assets/LogoAzul.png'
import logoWhite from '../../assets/LogoBranca.png'

const props = withDefaults(defineProps<{
  variant?: 'blue' | 'white'
  containerClass?: string
  logoClass?: string
  textClass?: string
}>(), {
  variant: 'blue',
  containerClass: 'flex items-center gap-3',
  logoClass: 'w-[30px] h-auto',
  textClass: ''
})

const logoUrl = computed(() => props.variant === 'white' ? logoWhite : logoBlue)
const textClass = computed(() => props.textClass || (
  props.variant === 'white'
    ? 'text-white text-[1.75rem] font-extrabold m-0 tracking-tight'
    : 'text-xl font-extrabold text-[var(--p-primary-600)] tracking-tight'
))
</script>
