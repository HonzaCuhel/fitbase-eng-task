<template>
  <NuxtLink
    v-if="!classData.isFull"
    :to="`/app/${gymSlug}/enroll/${classData._id}`"
    class="block w-full rounded-lg bg-primary px-4 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-primary-dark"
  >
    {{ $t('app.enrollNow') }}
  </NuxtLink>
  <div
    v-else
    class="w-full rounded-lg bg-gray-100 px-4 py-3 text-center text-sm font-medium text-gray-400"
  >
    {{ $t('class.full') }}
  </div>
</template>

<script setup>
defineProps({
  classData: { type: Object, required: true },
  gymSlug: { type: String, required: true },
})
</script>
