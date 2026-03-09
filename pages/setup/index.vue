<template>
  <div class="mx-auto max-w-lg py-12">
    <h1 class="mb-2 text-3xl font-bold text-gray-800">{{ $t('gym.title') }}</h1>
    <p class="mb-8 text-gray-500">{{ $t('gym.setupDescription') }}</p>

    <Form :model="form" :rules="rules" @submit="onSubmit">
      <InputBlock :label="$t('gym.name')" prop="name">
        <TextInput v-model="form.name" />
      </InputBlock>

      <InputBlock :label="$t('gym.contact') + ' - Email'" prop="email">
        <TextInput v-model="form.email" type="email" />
      </InputBlock>

      <InputBlock :label="$t('gym.contact') + ' - Phone'" prop="phone">
        <TextInput v-model="form.phone" />
      </InputBlock>

      <InputBlock :label="$t('gym.contact') + ' - Address'" prop="address">
        <TextInput v-model="form.address" />
      </InputBlock>

      <div class="mt-6">
        <Button type="primary" native-type="submit" :loading="isSubmitting" class="w-full">
          {{ $t('common.save') }}
        </Button>
      </div>
    </Form>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'main',
})

useHead({ title: useT()('gym.title') })

const gymStore = useGymStore()
const router = useRouter()
const { required, email } = useFormRules()

const form = ref({
  name: '',
  email: '',
  phone: '',
  address: '',
})

const rules = {
  name: [required()],
  email: [required(), email()],
}

const isSubmitting = ref(false)

const onSubmit = async () => {
  isSubmitting.value = true
  try {
    await gymStore.update({
      name: form.value.name,
      contact: {
        email: form.value.email,
        phone: form.value.phone,
        address: form.value.address,
      },
    })
    router.push('/')
  }
  finally {
    isSubmitting.value = false
  }
}
</script>
