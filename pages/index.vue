<template>
  <div>
    <h1 class="mb-6 text-3xl font-bold text-gray-800">{{ $t('dashboard.title') }}</h1>
    <DashboardStats />
    <div class="mt-8">
      <DashboardUpcoming />
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'main',
})

const t = useT()
useHead({ title: t('dashboard.title') })
</script>
