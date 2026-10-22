<template>
  <div class="app-empty-state" role="status">
    <span class="app-empty-state-icon"><i class="pi pi-search" aria-hidden="true" /></span>
    <strong>{{ title }}</strong>
    <p>{{ description }}</p>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ title: string; description?: string }>(), {
  description: 'Tente outra pesquisa ou ajuste os filtros para encontrar o que procura.'
})
</script>
