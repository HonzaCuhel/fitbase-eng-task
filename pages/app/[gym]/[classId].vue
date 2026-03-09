<template>
  <div v-loading="!memberAppStore.selectedClass" :class="{ 'min-h-[50vh]': !memberAppStore.selectedClass }">
    <template v-if="memberAppStore.selectedClass">
      <NuxtLink :to="`/app/${gymSlug}`" class="mb-4 inline-block text-sm text-gray-500 hover:text-gray-700">
        &larr; {{ $t('common.back') }}
      </NuxtLink>

      <AppClassDetail :class-data="memberAppStore.selectedClass" :gym-slug="gymSlug" />
    </template>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'member-app',
})

useHead({ title: useT()('app.classDetails') })

const route = useRoute()
const memberAppStore = useMemberAppStore()

const gymSlug = computed(() => route.params.gym)

onMounted(() => {
  memberAppStore.fetchPublicClass(route.params.classId)
})
</script>
