<template>
  <div class="mx-auto max-w-lg">
    <NuxtLink :to="`/app/${gymSlug}/${classId}`" class="mb-4 inline-block text-sm text-gray-500 hover:text-gray-700">
      &larr; {{ $t('common.back') }}
    </NuxtLink>

    <div v-if="isSuccess" class="rounded-lg border border-green-200 bg-green-50 p-8 text-center">
      <Icon name="check-circle-broken" class="mx-auto mb-2 h-8 w-8 text-green-600" />
      <p class="text-green-800">
        {{ isWaitlisted ? $t('app.waitlistSuccess') : $t('app.enrollSuccess') }}
      </p>
      <NuxtLink :to="`/app/${gymSlug}`" class="mt-4 inline-block text-primary hover:underline">
        {{ $t('app.browseClasses') }}
      </NuxtLink>
    </div>

    <div v-else>
      <h1 class="mb-6 text-2xl font-bold text-gray-800">{{ $t('app.enrollNow') }}</h1>

      <Form :model="form" :rules="rules" @submit="onSubmit">
        <InputBlock :label="$t('member.firstName')" prop="firstName">
          <TextInput v-model="form.firstName" />
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

        <div class="mt-6">
          <Button type="primary" native-type="submit" :loading="isSubmitting" class="w-full">
            {{ $t('app.enrollNow') }}
          </Button>
        </div>
      </Form>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'member-app',
})

useHead({ title: useT()('app.enrollNow') })

const route = useRoute()
const memberAppStore = useMemberAppStore()
const { required, email } = useFormRules()

const gymSlug = computed(() => route.params.gym)
const classId = computed(() => route.params.classId)

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
const isWaitlisted = ref(false)
const isSuccess = ref(false)

const onSubmit = async () => {
  isSubmitting.value = true
  try {
    const result = await memberAppStore.enrollPublic(classId.value, form.value)
    isWaitlisted.value = result?.status?.confirmation === 2
    isSuccess.value = true
  }
  catch (error) {
    useToast().error(error?.data?.error || useT()('errors.enrollmentFailed'))
  }
  finally {
    isSubmitting.value = false
  }
}
</script>
