<template>
  <div>
    <Form :model="form" :rules="rules" @submit="onSubmit">
      <InputBlock :label="$t('class.className')" prop="title">
        <TextInput v-model="form.title" />
      </InputBlock>

      <InputBlock :label="$t('class.type')" prop="type">
        <Select v-model="form.type" :options="classTypeOptions" />
      </InputBlock>

      <InputBlock :label="$t('class.trainer')" prop="trainer">
        <Select v-model="form.trainer" :options="trainerOptions" :clearable="true" />
      </InputBlock>

      <InputBlock :label="$t('class.description')" prop="description">
        <div class="relative w-full">
          <TextArea v-model="form.description" />
          <AiDescriptionGenerator
            :title="form.title"
            :type="form.type"
            :trainer-name="selectedTrainerName"
            @generated="form.description = $event"
          />
        </div>
      </InputBlock>

      <div class="grid grid-cols-2 gap-4">
        <InputBlock :label="$t('class.capacity')" prop="capacity">
          <TextInput :model-value="String(form.capacity)" @update:model-value="form.capacity = Number($event)" type="number" />
        </InputBlock>

        <InputBlock :label="$t('class.location')" prop="location">
          <TextInput v-model="form.location" />
        </InputBlock>
      </div>

      <div class="mt-6 flex justify-end gap-2">
        <Button @click="dialogStore.close()">{{ $t('common.cancel') }}</Button>
        <Button type="primary" native-type="submit" :loading="isSubmitting">
          {{ $t('common.save') }}
        </Button>
      </div>
    </Form>
  </div>
</template>

<script setup>
const props = defineProps({
  classData: { type: Object, default: null },
  classId: { type: String, default: null },
  mode: { type: String, default: 'create' },
})

const classesStore = useClassesStore()
const classStore = useClassStore()
const trainersStore = useTrainersStore()
const dialogStore = useDialogStore()
const { required } = useFormRules()

const classTypes = ['yoga', 'hiit', 'pilates', 'strength', 'barre', 'meditation', 'crossfit', 'other']

const t = useT()

const classTypeOptions = computed(() => classTypes.map((type) => ({ id: type, text: t(`class.types.${type}`) })))

const trainerOptions = computed(() => trainersStore.trainers.map((trainer) => ({ id: trainer._id, text: trainer.fullName })))

const form = ref({
  title: props.classData?.general?.title || '',
  type: props.classData?.general?.type || 'other',
  description: props.classData?.general?.description || '',
  capacity: props.classData?.general?.capacity || 20,
  location: props.classData?.general?.location || '',
  trainer: props.classData?.general?.trainer?._id || props.classData?.general?.trainer || '',
})

const rules = {
  title: [required()],
}

const selectedTrainerName = computed(() => {
  const trainer = trainersStore.trainers.find((t) => t._id === form.value.trainer)
  return trainer?.fullName || ''
})

const isSubmitting = ref(false)

const onSubmit = async () => {
  isSubmitting.value = true
  try {
    const body = {
      general: {
        title: form.value.title,
        type: form.value.type,
        description: form.value.description,
        capacity: form.value.capacity,
        location: form.value.location,
        trainer: form.value.trainer || undefined,
      },
    }

    if (props.mode === 'edit' && props.classId) {
      await classStore.update(props.classId, body)
    }
    else {
      await classesStore.addClass(body)
      dialogStore.close()
    }
  }
  finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  if (!trainersStore.trainers.length) {
    trainersStore.fetchTrainers()
  }
})
</script>
