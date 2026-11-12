<template>
    <Dialog :visible="visible" @update:visible="value => { if (!busy) emit('update:visible', value); }" header="Excluir permanentemente" modal :draggable="false" :closable="!busy" :closeOnEscape="!busy" class="app-dialog" :style="{ width: '480px' }">
        <div class="app-confirm-body">
            <i class="pi pi-exclamation-triangle app-confirm-icon" aria-hidden="true" />
            <div class="app-dialog-section"><span>Deseja excluir permanentemente <strong>{{ recordName }}</strong>?</span><span>Esta ação não pode ser desfeita.</span></div>
        </div>
        <template #footer>
            <Button label="Cancelar" icon="pi pi-times" text :disabled="busy" @click="emit('update:visible', false)" />
            <Button label="Excluir permanentemente" icon="pi pi-trash" severity="danger" :loading="busy" :disabled="busy" @click="emit('confirm')" />
        </template>
    </Dialog>
</template>
<script setup lang="ts">
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
defineProps<{ visible: boolean; recordName: string; busy?: boolean }>();
const emit = defineEmits<{ 'update:visible': [value: boolean]; confirm: [] }>();
</script>
