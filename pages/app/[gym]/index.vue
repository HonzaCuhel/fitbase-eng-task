<template>
  <div v-loading="memberAppStore.isLoading" :class="{ 'min-h-[50vh]': memberAppStore.isLoading }">
    <h1 class="mb-2 text-3xl font-bold text-gray-800">{{ $t('app.browseClasses') }}</h1>
    <p class="mb-8 text-gray-500">Find the perfect class for you and enroll today.</p>

    <div v-if="!memberAppStore.isLoading && memberAppStore.publishedClasses.length === 0" class="py-12 text-center text-gray-400">
      {{ $t('common.noResults') }}
    </div>

    <div v-else-if="!memberAppStore.isLoading" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <AppClassCard
        v-for="cls in memberAppStore.publishedClasses"
        :key="cls._id"
        :class-data="cls"
        :gym-slug="gymSlug"
      />
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'member-app',
})

useHead({ title: useT()('app.browseClasses') })

const route = useRoute()
const memberAppStore = useMemberAppStore()

const gymSlug = computed(() => route.params.gym)

onMounted(() => {
  memberAppStore.fetchPublicClasses()
})
</script>
