<template>
  <Form :model="form" :rules="rules" @submit="onSubmit">
    <InputBlock :label="$t('auth.fullName')" prop="fullName">
      <TextInput v-model="form.fullName" autofocus />
    </InputBlock>

    <InputBlock :label="$t('auth.email')" prop="email">
      <TextInput v-model="form.email" type="email" />
    </InputBlock>

    <InputBlock :label="$t('auth.password')" prop="password">
      <TextInput v-model="form.password" type="password" />
    </InputBlock>

    <InputBlock :label="$t('auth.gymName')" prop="gymName">
      <TextInput v-model="form.gymName" />
    </InputBlock>

    <div class="mt-4">
      <Button type="primary" native-type="submit" :loading="isSubmitting" class="w-full">
        {{ $t('auth.register') }}
      </Button>
    </div>
  </Form>
</template>

<script setup>
const authStore = useAuthStore()
const router = useRouter()
const { required, email, minLength } = useFormRules()

const form = ref({
  fullName: '',
  email: '',
  password: '',
  gymName: '',
})

const rules = {
  fullName: [required()],
  email: [required(), email()],
  password: [required(), minLength(8)],
  gymName: [required()],
}

const isSubmitting = ref(false)

const onSubmit = async () => {
  isSubmitting.value = true
  try {
    await authStore.register(form.value.fullName, form.value.email, form.value.password, form.value.gymName)
    router.push('/setup')
  }
  finally {
    isSubmitting.value = false
  }
}
</script>
