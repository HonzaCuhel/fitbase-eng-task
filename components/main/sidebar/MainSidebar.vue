<template>
  <aside
    class="flex w-56 flex-col border-r border-gray-200 bg-white transition-all duration-200"
    :class="{ '-ml-56 lg:ml-0': generalStore.isSidebarCollapsed }"
  >
    <div class="flex h-14 items-center border-b border-gray-200 px-4">
      <MainLogo />
    </div>

    <nav class="flex-1 px-2 py-4">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="mb-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors"
        :class="isActive(item.to) ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'"
      >
        <Icon :name="item.icon" class="h-5 w-5" />
        {{ item.label }}
      </NuxtLink>
    </nav>
  </aside>
</template>

<script setup>
const route = useRoute()
const t = useT()
const generalStore = useGeneralStore()

const navItems = computed(() => [
  { to: '/', label: t('nav.dashboard'), icon: 'home-line' },
  { to: '/classes', label: t('nav.classes'), icon: 'book-open-01' },
  { to: '/members', label: t('nav.members'), icon: 'users-01' },
  { to: '/trainers', label: t('nav.trainers'), icon: 'star-01' },
  { to: '/settings', label: t('nav.settings'), icon: 'settings-01' },
])

const isActive = (to) => {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}
</script>
