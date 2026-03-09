<template>
  <div class="flex min-h-screen items-center justify-center">
    <div class="text-center">
      <MainLogo class="mb-8" />
      <h1 class="text-6xl font-bold text-gray-800">{{ error?.statusCode || 500 }}</h1>
      <p class="mt-4 text-lg text-gray-500">{{ error?.message || $t('common.backToHome') }}</p>
      <NuxtLink to="/" class="mt-8 inline-block text-primary hover:underline">
        {{ $t('common.backToHome') }}
      </NuxtLink>
      <pre v-if="isDev" class="mt-8 max-w-xl overflow-auto rounded bg-gray-100 p-4 text-left text-xs text-gray-600">{{ error?.stack }}</pre>
    </div>
  </div>
</template>

<script setup>
defineProps({
  error: Object,
})

const isDev = process.env.NODE_ENV === 'development'
</script>
