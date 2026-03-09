<template>
  <div v-loading="gymStore.isLoading" :class="{ 'min-h-[200px]': gymStore.isLoading }">
    <Form v-if="!gymStore.isLoading" :model="form" :rules="rules" @submit="onSubmit">
      <h3 class="mb-4 text-sm font-medium uppercase text-gray-400">{{ $t('gym.branding') }}</h3>

      <InputBlock :label="$t('gym.name')" prop="name">
        <TextInput v-model="form.name" />
      </InputBlock>

      <InputBlock :label="$t('gym.primaryColor')" prop="primaryColor">
        <div class="flex items-center gap-2">
          <input v-model="form.primaryColor" type="color" class="h-8 w-8 cursor-pointer rounded border" />
          <TextInput v-model="form.primaryColor" class="w-32" />
        </div>
      </InputBlock>

      <h3 class="mb-4 mt-8 text-sm font-medium uppercase text-gray-400">{{ $t('gym.contact') }}</h3>

      <InputBlock :label="$t('gym.email')" prop="contactEmail">
        <TextInput v-model="form.contactEmail" type="email" />
      </InputBlock>

      <InputBlock :label="$t('gym.phone')" prop="contactPhone">
        <TextInput v-model="form.contactPhone" type="tel" />
      </InputBlock>

      <InputBlock :label="$t('gym.address')" prop="contactAddress">
        <TextArea v-model="form.contactAddress" :rows="3" />
      </InputBlock>

      <h3 class="mb-4 mt-8 text-sm font-medium uppercase text-gray-400">{{ $t('gym.settings') }}</h3>

      <InputBlock :label="$t('gym.timezone')" prop="timezone">
        <TextInput v-model="form.timezone" />
      </InputBlock>

      <InputBlock :label="$t('gym.defaultLanguage')" prop="defaultLocale">
        <Select v-model="form.defaultLocale" :options="localeOptions" />
      </InputBlock>

      <div class="mt-6">
        <Button type="primary" native-type="submit" :loading="isSubmitting">
          {{ $t('common.save') }}
        </Button>
      </div>
    </Form>
  </div>
</template>

<script setup>
const gymStore = useGymStore()

onMounted(async () => {
  await gymStore.fetch()
})
const { required } = useFormRules()

const localeOptions = [
  { id: 'en', text: 'English' },
  { id: 'cs', text: 'Čeština' },
  { id: 'es', text: 'Español' },
]

const form = ref({
  name: gymStore.name,
  primaryColor: gymStore.branding.primaryColor,
  contactEmail: gymStore.contact.email,
  contactPhone: gymStore.contact.phone,
  contactAddress: gymStore.contact.address,
  timezone: gymStore.settings.timezone,
  defaultLocale: gymStore.settings.defaultLocale,
})

const rules = {
  name: [required()],
}

const isSubmitting = ref(false)

const onSubmit = async () => {
  isSubmitting.value = true
  try {
    await gymStore.update({
      name: form.value.name,
      branding: { primaryColor: form.value.primaryColor },
      contact: {
        email: form.value.contactEmail,
        phone: form.value.contactPhone,
        address: form.value.contactAddress,
      },
      settings: {
        timezone: form.value.timezone,
        defaultLocale: form.value.defaultLocale,
      },
    })
  }
  finally {
    isSubmitting.value = false
  }
}

watch(() => gymStore.$state, () => {
  form.value.name = gymStore.name
  form.value.primaryColor = gymStore.branding.primaryColor
  form.value.contactEmail = gymStore.contact.email
  form.value.contactPhone = gymStore.contact.phone
  form.value.contactAddress = gymStore.contact.address
  form.value.timezone = gymStore.settings.timezone
  form.value.defaultLocale = gymStore.settings.defaultLocale
}, { deep: true })
</script>
