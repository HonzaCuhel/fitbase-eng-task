<template>
  <div>
    <div class="mb-2 text-sm font-medium uppercase text-primary">
      {{ $t(`class.types.${classData.general.type}`) }}
    </div>
    <h1 class="mb-4 text-3xl font-bold text-gray-800">{{ classData.general.title }}</h1>

    <div class="grid gap-8 lg:grid-cols-3">
      <div class="lg:col-span-2">
        <p v-if="classData.general.description" class="mb-6 text-gray-600 leading-relaxed">
          {{ classData.general.description }}
        </p>

        <div v-if="classData.schedule?.length" class="mb-6">
          <h2 class="mb-3 text-lg font-semibold text-gray-800">{{ $t('app.classSchedule') }}</h2>
          <div class="space-y-2">
            <div v-for="(session, i) in classData.schedule" :key="i" class="flex gap-4 text-sm">
              <span class="font-medium text-gray-700">{{ $t(`schedule.days.${session.dayOfWeek}`) }}</span>
              <span class="text-gray-500">{{ session.startTime }} - {{ session.endTime }}</span>
              <span v-if="session.room" class="text-gray-400">{{ session.room }}</span>
            </div>
          </div>
        </div>

        <div v-if="classData.general.trainer" class="mb-6">
          <h2 class="mb-3 text-lg font-semibold text-gray-800">{{ $t('app.aboutTrainer') }}</h2>
          <div class="rounded-lg bg-gray-50 p-4">
            <h3 class="font-medium text-gray-800">{{ classData.general.trainer.fullName }}</h3>
            <p v-if="classData.general.trainer.bio" class="mt-1 text-sm text-gray-500">
              {{ classData.general.trainer.bio }}
            </p>
            <div v-if="classData.general.trainer.specialties?.length" class="mt-2 flex flex-wrap gap-1">
              <span
                v-for="spec in classData.general.trainer.specialties"
                :key="spec"
                class="rounded-full bg-white px-2 py-0.5 text-xs text-gray-500"
              >
                {{ spec }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div class="sticky top-8 rounded-lg border border-gray-200 bg-white p-6">
          <div class="mb-4 text-center">
            <div class="text-2xl font-bold text-gray-800">
              {{ classData.spotsLeft }}
            </div>
            <div class="text-sm text-gray-500">{{ $t('class.spotsLeft', { count: classData.spotsLeft }) }}</div>
          </div>

          <div class="mb-4 space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500">{{ $t('class.location') }}</span>
              <span class="text-gray-700">{{ classData.general.location || '-' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">{{ $t('class.capacity') }}</span>
              <span class="text-gray-700">{{ classData.enrollmentCount }}/{{ classData.general.capacity }}</span>
            </div>
          </div>

          <AppEnrollButton :class-data="classData" :gym-slug="gymSlug" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  classData: { type: Object, required: true },
  gymSlug: { type: String, required: true },
})
</script>
