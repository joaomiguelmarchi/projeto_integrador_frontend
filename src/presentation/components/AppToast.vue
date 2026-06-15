<template>
  <Toast :pt="toastPt">
    <template #message="{ message }">
      <div class="flex items-start gap-4 p-4 w-full">
        <i
          v-if="message.severity !== 'error'"
          class="pi text-2xl mt-0.5 text-[var(--p-primary-500)]"
          :class="message.severity === 'success' ? 'pi-check-circle' : 'pi-info-circle'"
        />

        <div class="flex flex-col flex-1 gap-1">
          <span
            class="font-bold text-base"
            :class="message.severity === 'error' ? 'text-red-500' : 'text-[var(--p-surface-800)]'"
          >
            {{ message.summary }}
          </span>
          <span
            class="text-sm"
            :class="message.severity === 'error' ? 'text-red-500' : 'text-[var(--p-surface-600)]'"
          >
            {{ message.detail }}
          </span>
        </div>
      </div>
    </template>
  </Toast>
</template>

<script setup lang="ts">
import Toast from 'primevue/toast';

const toastPt = {
  root: { class: 'w-full max-w-[400px]' },
  message: { class: 'bg-[var(--p-surface-0)] rounded-2xl shadow-md border border-[var(--p-surface-200)]' },
  messageContent: { class: 'p-0' },
  messageText: { class: 'w-full' },
  messageIcon: { class: 'hidden' },
  closeButton: { class: 'hidden' }
};
</script>
