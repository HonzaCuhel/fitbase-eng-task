<template>
  <Form :model="form" :rules="rules" @submit="onSubmit">
    <InputBlock :label="$t('member.firstName')" prop="firstName">
      <TextInput v-model="form.firstName" autofocus />
    </InputBlock>

    <InputBlock :label="$t('member.lastName')" prop="lastName">
      <TextInput v-model="form.lastName" />
    </InputBlock>

    <InputBlock :label="$t('member.email')" prop="email">
      <TextInput v-model="form.email" type="email" />
    </InputBlock>

    <div class="mt-4 flex justify-end gap-2">
      <Button @click="dialogStore.close()">{{ $t('common.cancel') }}</Button>
      <Button type="primary" native-type="submit" :loading="isSubmitting">
        {{ $t('enrollment.enrolled') }}
      </Button>
    </div>
  </Form>
</template>

<script setup>
const props = defineProps({
  classId: { type: String, required: true },
})

const enrollmentsStore = useEnrollmentsStore()
const dialogStore = useDialogStore()
const { required, email } = useFormRules()

const form = ref({ firstName: '', lastName: '', email: '' })
const rules = {
  firstName: [required()],
  lastName: [required()],
  email: [required(), email()],
}

const isSubmitting = ref(false)

const onSubmit = async () => {
  isSubmitting.value = true
  try {
    await enrollmentsStore.enrollMember(props.classId, form.value)
    dialogStore.close()
  }
  finally {
    isSubmitting.value = false
  }
}
</script>
