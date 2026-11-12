<template>
    <section class="app-detail-section" :aria-label="title">
        <h3 class="app-detail-section-title"><i :class="['pi', icon]" aria-hidden="true" />{{ title }}</h3>
        <slot />
    </section>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ title: string; icon?: string }>(), { icon: 'pi-list' });
</script>
