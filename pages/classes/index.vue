<template>
  <div class="flex flex-1 flex-col">
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-3xl font-bold text-gray-800">{{ $t('class.title') }}</h1>
      <Button type="primary" @click="openAddClass">
        {{ $t('class.addClass') }}
      </Button>
    </div>

    <div class="mb-4 flex items-center gap-4">
      <TextInput
        v-model="search"
        :placeholder="$t('common.search')"
        class="w-64"
        @input="onSearch"
      />
      <div class="flex gap-2">
        <Button
          v-for="status in statuses"
          :key="status.value"
          :type="classesStore.filters.status === status.value ? 'primary' : 'regular-outline'"
          size="small"
          @click="classesStore.setFilter('status', classesStore.filters.status === status.value ? null : status.value)"
        >
          {{ status.label }}
        </Button>
      </div>
    </div>

    <ClassList :classes="classesStore.classes" :loading="classesStore.isLoading" />
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'main',
})

const t = useT()
useHead({ title: t('class.title') })
const classesStore = useClassesStore()
const dialogStore = useDialogStore()

const search = ref('')
const statuses = computed(() => [
  { value: 'published', label: t('class.status.published') },
  { value: 'draft', label: t('class.status.draft') },
  { value: 'archived', label: t('class.status.archived') },
])

const openAddClass = () => {
  dialogStore.open({
    component: resolveComponent('ClassForm'),
    title: t('class.addClass'),
  })
}

const onSearch = useDebounceFn(() => {
  classesStore.setSearch(search.value)
}, 300)

onMounted(() => {
  classesStore.fetchClasses()
})
</script>
