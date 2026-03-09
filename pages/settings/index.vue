<template>
  <div class="max-w-2xl">
    <h1 class="mb-6 text-3xl font-bold text-gray-800">{{ $t('gym.title') }}</h1>
    <GymSettings />
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'main',
})

useHead({ title: useT()('gym.title') })
</script>
