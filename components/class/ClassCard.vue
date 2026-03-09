<template>
  <NuxtLink :to="`/classes/${classData._id}`" class="block rounded-lg border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md">
    <div class="mb-3 flex items-start justify-between">
      <h3 class="text-lg font-semibold text-gray-800">{{ classData.general.title }}</h3>
      <ClassStatusBadge :status="classData.general.status" />
    </div>

    <p v-if="classData.general.description" class="mb-3 line-clamp-2 text-sm text-gray-500">
      {{ classData.general.description }}
    </p>

    <div class="flex flex-wrap items-center gap-3 text-xs text-gray-400">
      <span v-if="classData.general.trainer">{{ classData.general.trainer.fullName }}</span>
      <span v-if="classData.general.location">{{ classData.general.location }}</span>
      <span>
        {{ classData.enrollmentCount || 0 }}/{{ classData.general.capacity }}
        {{ $t('class.members').toLowerCase() }}
      </span>
    </div>

    <div v-if="classData.general.tags?.length" class="mt-3 flex flex-wrap gap-1">
      <span
        v-for="tag in classData.general.tags"
        :key="tag"
        class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500"
      >
        {{ tag }}
      </span>
    </div>
  </NuxtLink>
</template>

<script setup>
defineProps({
  classData: { type: Object, required: true },
})
</script>
