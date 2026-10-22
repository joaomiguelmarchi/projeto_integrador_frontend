<template>
  <div class="app-shell">
    <AppSidebar />

    <main class="app-main">
      <header class="app-page-header">
        <h1>{{ title }}</h1>
        <slot name="header-actions" />
      </header>

      <div class="app-page-content">
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
