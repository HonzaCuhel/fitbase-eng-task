<template>
  <div v-if="classStore.class" class="grid grid-cols-1 gap-6 lg:grid-cols-3">
    <div class="space-y-6 lg:col-span-2">
      <div>
        <h2 class="mb-3 text-base font-semibold text-gray-800">{{ $t('class.aboutClass') }}</h2>
        <p class="text-sm leading-relaxed text-gray-500">
          {{ classStore.class.general.description || $t('class.noDescription') }}
        </p>
      </div>

      <div>
        <h3 class="mb-2 text-sm font-semibold text-gray-800">{{ $t('class.schedule') }}</h3>
        <div v-if="classStore.class.schedule?.length">
          <div
            v-for="(session, i) in classStore.class.schedule"
            :key="i"
            class="flex gap-3 border-b border-gray-100 py-2 last:border-0"
          >
            <span class="text-sm font-medium text-gray-700">
              {{ $t(`schedule.days.${session.dayOfWeek}`) }}
            </span>
            <span class="text-sm text-gray-400">{{ session.startTime }} - {{ session.endTime }}</span>
            <span v-if="session.room" class="text-xs text-gray-300">{{ session.room }}</span>
          </div>
        </div>
        <p v-else class="text-sm text-gray-400">{{ $t('class.noSchedule') }}</p>
      </div>

      <div v-if="classStore.class.general.tags?.length" class="flex flex-wrap gap-1.5">
        <span
          v-for="tag in classStore.class.general.tags"
          :key="tag"
          class="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-500"
        >
          {{ tag }}
        </span>
      </div>
    </div>

    <div class="space-y-4">
      <div class="rounded-lg border border-gray-200 bg-white p-5">
        <h3 class="mb-4 text-sm font-semibold text-gray-800">{{ $t('class.details') }}</h3>

        <dl class="space-y-3">
          <div>
            <dt class="text-xs text-gray-400">{{ $t('class.trainer') }}</dt>
            <dd class="text-sm text-gray-700">{{ trainerName }}</dd>
          </div>
          <div>
            <dt class="text-xs text-gray-400">{{ $t('class.location') }}</dt>
            <dd class="text-sm text-gray-700">{{ classStore.class.general.location || $t('common.notSet') }}</dd>
          </div>
          <div>
            <dt class="text-xs text-gray-400">{{ $t('class.capacity') }}</dt>
            <dd class="text-sm text-gray-700">
              {{ classStore.class.enrollmentCount || 0 }}/{{ classStore.class.general.capacity }}
              <span v-if="classStore.class.waitlistCount" class="ml-1 text-xs text-gray-400">
                · {{ $t('class.waitlistCount', { count: classStore.class.waitlistCount }) }}
              </span>
            </dd>
          </div>
          <div>
            <dt class="text-xs text-gray-400">{{ $t('class.type') }}</dt>
            <dd class="text-sm text-gray-700">{{ $t(`class.types.${classStore.class.general.type}`) }}</dd>
          </div>
          <div>
            <dt class="text-xs text-gray-400">{{ $t('common.status') }}</dt>
            <dd class="mt-0.5"><ClassStatusBadge :status="classStore.class.general.status" /></dd>
          </div>
          <div>
            <dt class="text-xs text-gray-400">{{ $t('common.createdAt') }}</dt>
            <dd class="text-sm text-gray-700">{{ getFormattedDate(classStore.class.createdAt) }}</dd>
          </div>
        </dl>

        <div class="mt-4">
          <Button class="w-full" @click="goToEdit">{{ $t('class.editClass') }}</Button>
        </div>
      </div>

      <div class="rounded-lg border border-gray-200 bg-white p-5">
        <h3 class="mb-3 text-sm font-semibold text-gray-800">{{ $t('class.recentMembers') }}</h3>
        <div v-if="recentMembers.length">
          <div
            v-for="member in recentMembers"
            :key="member._id"
            class="flex items-center justify-between border-b border-gray-50 py-1.5 last:border-0"
          >
            <span class="text-sm text-gray-700">
              {{ member.properties.firstName }} {{ member.properties.lastName }}
            </span>
            <MemberStatusBadge :status="member.status.confirmation" />
          </div>
        </div>
        <p v-else class="text-sm text-gray-400">{{ $t('class.noMembers') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { getFormattedDate } from '~/utils/formatDate'

const route = useRoute()
const router = useRouter()
const t = useT()
const classStore = useClassStore()

const recentMembers = ref([])

const trainerName = computed(() => {
  const trainer = classStore.class?.general?.trainer
  if (!trainer) return t('common.tbd')
  return trainer.fullName || t('common.tbd')
})

onMounted(async () => {
  try {
    const data = await useApi().get(`/classes/${route.params._id}/members`, {
      limit: 5,
      sortField: 'createdAt',
      sortDirection: 'desc',
    })
    recentMembers.value = data.results
  }
  catch (error) {
    void error
  }
})

const goToEdit = () => {
  router.push(`/classes/${route.params._id}/settings`)
}
</script>
