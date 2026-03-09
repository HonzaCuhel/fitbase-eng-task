<template>
  <Form :model="form" :rules="rules" @submit="onSubmit">
    <InputBlock :label="$t('auth.email')" prop="email">
      <TextInput v-model="form.email" type="email" autofocus />
    </InputBlock>

    <InputBlock :label="$t('auth.password')" prop="password">
      <TextInput v-model="form.password" type="password" />
    </InputBlock>

    <div class="mb-4 text-right">
      <NuxtLink to="/forgot-password" class="text-sm text-gray-500 hover:text-primary">
        {{ $t('auth.forgotPassword') }}
      </NuxtLink>
    </div>

    <Button type="primary" native-type="submit" :loading="isSubmitting" class="w-full">
      {{ $t('auth.login') }}
    </Button>
  </Form>
</template>

<script setup>
const authStore = useAuthStore()
const router = useRouter()
const { required, email } = useFormRules()

const form = ref({
  email: '',
  password: '',
})

const rules = {
  email: [required(), email()],
  password: [required()],
}

const isSubmitting = ref(false)

const onSubmit = async () => {
  isSubmitting.value = true
  try {
    await authStore.login(form.value.email, form.value.password)

    const redirectPath = sessionStorage.getItem('redirectPath')
    sessionStorage.removeItem('redirectPath')
    router.push(redirectPath || '/')
  }
  finally {
    isSubmitting.value = false
  }
}
</script>
