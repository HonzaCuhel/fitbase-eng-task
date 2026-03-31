<template>
  <NuxtLink
    :to="`/app/${gymSlug}/enroll/${classData._id}`"
    class="block w-full rounded-lg px-4 py-3 text-center text-sm font-medium text-white transition-colors"
    :class="classData.isFull
      ? 'bg-gray-500 hover:bg-gray-600'
      : 'bg-primary hover:bg-primary-dark'"
  >
    {{ classData.isFull ? $t('app.joinWaitlist') : $t('app.enrollNow') }}
  </NuxtLink>
</template>

<script setup>
defineProps({
  classData: { type: Object, required: true },
  gymSlug: { type: String, required: true },
})
</script>
