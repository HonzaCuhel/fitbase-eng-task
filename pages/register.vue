<template>
  <div>
    <h2 class="mb-6 text-center text-2xl font-semibold text-gray-800">{{ $t('auth.register') }}</h2>
    <AuthRegisterForm />
    <p class="mt-6 text-center text-sm text-gray-500">
      {{ $t('auth.hasAccount') }}
      <NuxtLink to="/login" class="text-primary hover:underline">{{ $t('auth.login') }}</NuxtLink>
    </p>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'auth',
  public: true,
})

useHead({ title: useT()('auth.register') })
</script>
