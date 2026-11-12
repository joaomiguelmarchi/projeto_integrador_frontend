<template>
    <section class="app-detail-summary" :aria-label="label">
        <div class="app-detail-identity">
            <span class="app-detail-icon"><i :class="['pi', icon]" aria-hidden="true" /></span>
            <div class="app-detail-heading"><span class="app-detail-eyebrow">{{ label }}</span><h2>{{ title || 'Não informado' }}</h2></div>
            <AppStatusBadge v-if="status" :value="status" />
        </div>
        <dl v-if="items.length" class="app-detail-meta">
            <div v-for="item in items" :key="item.label"><dt>{{ item.label }}</dt><dd>{{ item.value || 'Não informado' }}</dd></div>
        </dl>
    </section>
</template>

<script setup lang="ts">
import AppStatusBadge from './AppStatusBadge.vue';
withDefaults(defineProps<{
    label: string;
    title?: string;
    icon: string;
    status?: string;
    items?: { label: string; value?: string | number | null }[];
}>(), { items: () => [] });
</script>
