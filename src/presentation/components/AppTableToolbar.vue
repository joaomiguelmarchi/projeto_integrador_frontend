<template>
  <div class="app-table-toolbar">
    <div class="app-table-toolbar-search">
      <IconField>
        <InputIcon class="pi pi-search" />
        <InputText v-model="search" :placeholder="placeholder" :aria-label="placeholder" />
      </IconField>
      <Button v-if="hasFilters" label="Limpar filtros" icon="pi pi-filter-slash" text size="small" @click="$emit('clear')" />
    </div>
    <div v-if="$slots.default" class="app-table-toolbar-actions"><slot /></div>
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'

const search = defineModel<string | null>({ default: '' })
defineProps<{ placeholder: string; hasFilters: boolean }>()
defineEmits<{ clear: [] }>()
</script>
