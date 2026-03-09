<template>
  <div>
    <h2 class="mb-4 text-lg font-semibold text-gray-800">{{ $t('dashboard.upcomingClasses') }}</h2>

    <div v-if="upcomingClasses.length === 0" class="py-8 text-center text-gray-400">
      {{ $t('common.noResults') }}
    </div>

    <div v-else class="space-y-3">
      <NuxtLink
        v-for="cls in upcomingClasses"
        :key="cls._id"
        :to="`/classes/${cls._id}`"
        class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-sm"
      >
        <div>
          <h3 class="text-sm font-medium text-gray-800">{{ cls.general.title }}</h3>
          <p class="text-xs text-gray-400">
            {{ cls.general.trainer?.fullName || '' }} &middot; {{ cls.general.location || '' }}
          </p>
        </div>
        <div class="text-right">
          <ClassStatusBadge :status="cls.general.status" />
          <div class="mt-1 text-xs text-gray-400">
            {{ cls.enrollmentCount || 0 }}/{{ cls.general.capacity }}
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
const classesStore = useClassesStore()

const upcomingClasses = computed(() =>
  classesStore.classes
    .filter((c) => c.general.status === 'published')
    .slice(0, 5),
)
</script>
