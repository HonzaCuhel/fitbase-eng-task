<template>
  <div class="flex flex-wrap gap-4">
    <StatTile v-for="stat in stats" :key="stat.label" :value="String(stat.value)" :label="stat.label" :icon="stat.icon" />
  </div>
</template>

<script setup>
const t = useT()
const classesStore = useClassesStore()
const trainersStore = useTrainersStore()

const stats = computed(() => [
  { label: t('dashboard.totalClasses'), value: classesStore.total, icon: 'book-open-01' },
  { label: t('dashboard.totalTrainers'), value: trainersStore.total, icon: 'star-01' },
])

onMounted(async () => {
  if (!classesStore.classes.length) await classesStore.fetchClasses()
  if (!trainersStore.trainers.length) await trainersStore.fetchTrainers()
})
</script>
