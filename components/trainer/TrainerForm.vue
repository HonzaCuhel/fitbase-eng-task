<template>
  <Form :model="form" :rules="rules" @submit="onSubmit">
    <InputBlock :label="$t('trainer.fullName')" prop="fullName">
      <TextInput v-model="form.fullName" autofocus />
    </InputBlock>

    <InputBlock :label="$t('trainer.email')" prop="email">
      <TextInput v-model="form.email" type="email" />
    </InputBlock>

    <InputBlock :label="$t('trainer.specialties')" prop="specialties">
      <TextInput v-model="specialtiesInput" :placeholder="'Yoga, HIIT, Pilates'" />
    </InputBlock>

    <InputBlock :label="$t('trainer.bio')" prop="bio">
      <TextArea v-model="form.bio" />
    </InputBlock>

    <div class="mt-4 flex justify-end gap-2">
      <Button @click="dialogStore.close()">{{ $t('common.cancel') }}</Button>
      <Button type="primary" native-type="submit" :loading="isSubmitting">
        {{ $t('common.save') }}
      </Button>
    </div>
  </Form>
</template>

<script setup>
const props = defineProps({
  trainer: { type: Object, default: null },
})

const trainersStore = useTrainersStore()
const dialogStore = useDialogStore()
const { required, email } = useFormRules()

const form = ref({
  fullName: props.trainer?.fullName || '',
  email: props.trainer?.email || '',
  specialties: props.trainer?.specialties || [],
  bio: props.trainer?.bio || '',
})

const specialtiesInput = computed({
  get: () => form.value.specialties.join(', '),
  set: (val) => { form.value.specialties = val.split(',').map((s) => s.trim()).filter(Boolean) },
})

const rules = {
  fullName: [required()],
  email: [required(), email()],
}

const isSubmitting = ref(false)

const onSubmit = async () => {
  isSubmitting.value = true
  try {
    if (props.trainer?._id) {
      await trainersStore.updateTrainer(props.trainer._id, form.value)
    }
    else {
      await trainersStore.addTrainer(form.value)
    }
    dialogStore.close()
  }
  finally {
    isSubmitting.value = false
  }
}
</script>
