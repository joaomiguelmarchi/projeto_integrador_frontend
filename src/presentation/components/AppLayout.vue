<template>
  <div class="bg-[var(--p-surface-100)] h-screen w-full flex overflow-hidden font-sans text-[var(--p-surface-800)]">
    <AppSidebar />

    <main class="flex-1 flex flex-col overflow-hidden">
      <header class="h-[72px] bg-[var(--p-surface-100)] flex items-center justify-between px-8 shrink-0">
        <h1 class="text-[22px] font-bold text-[var(--p-surface-600)] m-0 tracking-tight">{{ title }}</h1>
        <slot name="header-actions" />
      </header>

      <div class="flex-1 px-8 pb-8 overflow-hidden flex flex-col">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import AppSidebar from './AppSidebar.vue'

defineProps<{
  title: string
}>()
</script>
