<template>
  <div class="flex flex-1 flex-col">
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-3xl font-bold text-gray-800">{{ $t('trainer.title') }}</h1>
      <Button type="primary" @click="openAddTrainer">
        {{ $t('trainer.addTrainer') }}
      </Button>
    </div>

    <TrainerList :trainers="trainersStore.trainers" :loading="trainersStore.isLoading" />
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'main',
})

const t = useT()
useHead({ title: t('trainer.title') })
const trainersStore = useTrainersStore()
const dialogStore = useDialogStore()

const openAddTrainer = () => {
  dialogStore.open({
    component: resolveComponent('TrainerForm'),
    title: t('trainer.addTrainer'),
  })
}

onMounted(() => {
  trainersStore.fetchTrainers()
})
</script>
