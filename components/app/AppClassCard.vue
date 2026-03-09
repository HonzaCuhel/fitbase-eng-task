<template>
  <NuxtLink
    :to="`/app/${gymSlug}/${classData._id}`"
    class="block rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
  >
    <div class="mb-2 text-xs font-medium uppercase text-primary">
      {{ $t(`class.types.${classData.general.type}`) }}
    </div>
    <h3 class="mb-2 text-lg font-semibold text-gray-800">{{ classData.general.title }}</h3>
    <p v-if="classData.general.description" class="mb-4 line-clamp-2 text-sm text-gray-500">
      {{ classData.general.description }}
    </p>

    <div class="flex items-center justify-between text-xs text-gray-400">
      <span v-if="classData.general.trainer">{{ classData.general.trainer.fullName }}</span>
      <span :class="classData.isFull ? 'text-danger font-medium' : ''">
        {{ classData.isFull ? $t('class.full') : $t('class.spotsLeft', { count: classData.spotsLeft }) }}
      </span>
    </div>
  </NuxtLink>
</template>

<script setup>
defineProps({
  classData: { type: Object, required: true },
  gymSlug: { type: String, required: true },
})
</script>
