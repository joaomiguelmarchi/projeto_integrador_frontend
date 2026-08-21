<template>
  <aside class="w-64 bg-[var(--p-surface-100)] border-r border-[var(--p-surface-200)] flex flex-col z-10 shadow-[4px_0_24px_rgba(0,0,0,0.04)]">
    <div class="h-[72px] flex items-center px-6 border-b border-transparent">
      <AppBrand />
    </div>

    <nav class="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">
      <button
        v-for="item in menuItems"
        :key="item.label"
        type="button"
        :disabled="!item.route"
        :class="[
          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left group',
          item.spacer ? 'mt-auto' : '',
          item.route ? 'cursor-pointer' : 'cursor-not-allowed opacity-70',
          isActive(item.route)
            ? 'bg-[var(--p-surface-0)] text-[var(--p-primary-600)] shadow-sm'
            : 'text-[var(--p-surface-500)] hover:bg-[var(--p-surface-0)] hover:text-[var(--p-surface-800)]'
        ]"
        @click="navigate(item.route)"
      >
        <i
          :class="[
            'pi transition-colors',
            item.icon,
            isActive(item.route)
              ? 'text-[var(--p-primary-600)]'
              : 'text-[var(--p-surface-400)] group-hover:text-[var(--p-surface-600)]'
          ]"
        />
        <span :class="isActive(item.route) ? 'font-semibold text-[15px]' : 'font-medium text-[15px]'">
          {{ item.label }}
        </span>
      </button>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import AppBrand from './AppBrand.vue'

interface MenuItem {
  label: string
  icon: string
  route?: string
  spacer?: boolean
}

const route = useRoute()
const router = useRouter()

const menuItems: MenuItem[] = [
  { label: 'Início', icon: 'pi-home', route: '/inicio' },
  { label: 'Cadastro de Paciente', icon: 'pi-users', route: '/cadastroPaciente' },
  { label: 'Conta Paciente', icon: 'pi-folder' },
  { label: 'Orçamento', icon: 'pi-dollar', route: '/orcamento' },
  { label: 'Agenda', icon: 'pi-calendar', route: '/schedule' },
  { label: 'Faturamento', icon: 'pi-receipt' },
  { label: 'Procedimentos', icon: 'pi-list', route: '/procedimentos' },
  { label: 'Configurações', icon: 'pi-cog', spacer: true }
]

const isActive = (itemRoute?: string) => itemRoute === route.path

const navigate = (itemRoute?: string) => {
  if (itemRoute && itemRoute !== route.path) {
    router.push(itemRoute)
  }
}
</script>
