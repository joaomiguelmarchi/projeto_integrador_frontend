<template>
  <span class="px-4 py-1.5 rounded-full inline-flex items-center gap-2 border border-[var(--p-surface-300)] bg-[var(--p-surface-0)] text-[var(--p-surface-500)] whitespace-nowrap">
    <span class="w-3 h-3 rounded-full" :style="{ backgroundColor: color }" aria-hidden="true" />
    {{ value }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ value: string }>()
// Mesmos indicadores e cores utilizados nas listagens de orçamento e procedimentos.
const color = computed(() => {
  if (['Faturado', 'Pago', 'Aprovado', 'Ativo'].includes(props.value)) return 'var(--p-primary-1000)'
  if (props.value === 'Pendente') return 'var(--p-primary-25)'
  if (props.value === 'Rejeitado') return 'var(--p-primary-1010)'
  return 'var(--p-surface-500)'
})
</script>
