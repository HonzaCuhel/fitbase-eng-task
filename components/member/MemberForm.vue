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

    <InputBlock :label="$t('member.phone')" prop="phone">
      <TextInput v-model="form.phone" type="tel" />
    </InputBlock>

    <div class="mt-4 flex justify-end gap-2">
      <Button @click="dialogStore.close()">{{ $t('common.cancel') }}</Button>
      <Button type="primary" native-type="submit" :loading="isSubmitting">
        {{ $t('member.addMember') }}
      </Button>
    </div>
  </Form>
</template>

<script setup>
const props = defineProps({
  classId: { type: String, required: true },
})

const membersStore = useMembersStore()
const dialogStore = useDialogStore()
const { required, email } = useFormRules()

const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
})

const rules = {
  firstName: [required()],
  lastName: [required()],
  email: [required(), email()],
}

const isSubmitting = ref(false)

const onSubmit = async () => {
  isSubmitting.value = true
  try {
    await membersStore.addMember(props.classId, {
      properties: form.value,
      status: { confirmation: 0 },
    })
    dialogStore.close()
  }
  finally {
    isSubmitting.value = false
  }
}
</script>
