<template>
  <div v-loading="loading" :class="{ 'flex-1': loading }">
    <EmptyState v-if="!loading && trainers.length === 0" :title="$t('common.noResults')" icon="search-lg" />

    <div v-else-if="!loading" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <TrainerCard
        v-for="trainer in trainers"
        :key="trainer._id"
        :trainer="trainer"
        @edit="onEdit"
        @delete="onDelete"
      />
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  trainers: { type: Array, required: true },
  loading: { type: Boolean, default: false },
})

const dialogStore = useDialogStore()
const trainersStore = useTrainersStore()
const t = useT()

const onEdit = (trainer) => {
  dialogStore.open({
    component: resolveComponent('TrainerForm'),
    props: { trainer },
    title: t('common.edit'),
  })
}

const modalStore = useModalStore()

const onDelete = (trainer) => {
  modalStore.open({
    type: 'danger',
    title: t('trainer.confirmRemove', { name: trainer.fullName }),
    onSubmit: async () => {
      await trainersStore.deleteTrainer(trainer._id)
    },
  })
}
</script>
