<template>
  <div v-loading="classStore.isLoading" class="flex flex-1 flex-col">
    <template v-if="classStore.class">
      <div class="mb-6 flex items-center gap-4">
        <NuxtLink to="/classes" class="text-gray-400 hover:text-gray-600">
          <span class="text-lg">&larr;</span>
        </NuxtLink>
        <h1 class="text-2xl font-bold text-gray-800">{{ classStore.getTitle }}</h1>
        <ClassStatusBadge :status="classStore.class.general.status" />
      </div>

      <div class="mb-6 flex gap-1 border-b border-gray-200">
        <NuxtLink
          v-for="tab in tabs"
          :key="tab.to"
          :to="tab.to"
          class="border-b-2 px-4 py-2 text-sm font-medium transition-colors"
          :class="isActiveTab(tab.to) ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'"
        >
          {{ tab.label }}
        </NuxtLink>
      </div>

      <NuxtPage />
    </template>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'main',
})

const route = useRoute()
const classStore = useClassStore()
const t = useT()
useHead({ title: computed(() => classStore.getTitle || t('class.title')) })

const classId = computed(() => route.params._id)

const tabs = computed(() => [
  { to: `/classes/${classId.value}`, label: t('class.overview') },
  { to: `/classes/${classId.value}/members`, label: t('class.members') },
  { to: `/classes/${classId.value}/schedule`, label: t('class.schedule') },
  { to: `/classes/${classId.value}/settings`, label: t('class.settings') },
])

const isActiveTab = (to) => {
  return route.path === to || (to.endsWith(classId.value) && route.path === `${to}/`)
}

onMounted(() => {
  classStore.fetch(classId.value)
})

onUnmounted(() => {
  classStore.reset()
})
</script>
