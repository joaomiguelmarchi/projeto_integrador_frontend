<template>
  <span class="app-status-badge" :class="`app-status-badge-${tone}`">
    <span class="app-status-dot" aria-hidden="true" />
    {{ value }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ value: string }>()
const tone = computed(() => {
  if (['Faturado', 'Pago', 'Aprovado', 'Ativo', 'Confirmado'].includes(props.value)) return 'success'
  if (props.value === 'Pendente') return 'warning'
  if (props.value === 'Rejeitado') return 'danger'
  return 'neutral'
})
</script>
