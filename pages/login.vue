<template>
  <div>
    <h2 class="mb-6 text-center text-2xl font-semibold text-gray-800">{{ $t('auth.login') }}</h2>
    <AuthLoginForm />
    <p class="mt-6 text-center text-sm text-gray-500">
      {{ $t('auth.noAccount') }}
      <NuxtLink to="/register" class="text-primary hover:underline">{{ $t('auth.register') }}</NuxtLink>
    </p>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'auth',
  public: true,
})

useHead({ title: useT()('auth.login') })
</script>
