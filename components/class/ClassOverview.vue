<template>
  <!-- TASK 3: This component needs refactoring. It works but doesn't follow project patterns. -->
  <div v-if="classData" style="padding: 0;">
    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px;">
      <div>
        <h2 style="font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 12px;">About this class</h2>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
          {{ classData.general.description || 'No description available.' }}
        </p>

        <div style="margin-top: 24px;">
          <h3 style="font-size: 14px; font-weight: 600; color: #1f2937; margin-bottom: 8px;">Schedule</h3>
          <div v-if="classData.schedule && classData.schedule.length > 0">
            <div v-for="(session, i) in classData.schedule" :key="i" style="display: flex; gap: 12px; padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
              <span style="font-weight: 500; font-size: 13px; color: #374151;">
                {{ getDayName(session.dayOfWeek) }}
              </span>
              <span style="color: #9ca3af; font-size: 13px;">
                {{ session.startTime }} - {{ session.endTime }}
              </span>
              <span v-if="session.room" style="color: #d1d5db; font-size: 12px;">{{ session.room }}</span>
            </div>
          </div>
          <p v-else style="color: #9ca3af; font-size: 13px;">No schedule set.</p>
        </div>

        <div style="margin-top: 24px;">
          <h3 style="font-size: 14px; font-weight: 600; color: #1f2937; margin-bottom: 8px;">Tags</h3>
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            <span
              v-for="tag in classData.general.tags"
              :key="tag"
              style="background: #f3f4f6; padding: 2px 10px; border-radius: 12px; font-size: 12px; color: #6b7280;"
            >
              {{ tag }}
            </span>
          </div>
        </div>
      </div>

      <div>
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
          <h3 style="font-size: 14px; font-weight: 600; color: #1f2937; margin-bottom: 16px;">Details</h3>

          <div style="margin-bottom: 12px;">
            <span style="font-size: 12px; color: #9ca3af; display: block;">Trainer</span>
            <span style="font-size: 14px; color: #374151;">{{ trainerName }}</span>
          </div>

          <div style="margin-bottom: 12px;">
            <span style="font-size: 12px; color: #9ca3af; display: block;">Location</span>
            <span style="font-size: 14px; color: #374151;">{{ classData.general.location || 'Not set' }}</span>
          </div>

          <div style="margin-bottom: 12px;">
            <span style="font-size: 12px; color: #9ca3af; display: block;">Capacity</span>
            <span style="font-size: 14px; color: #374151;">
              {{ classData.enrollmentCount || 0 }} / {{ classData.general.capacity }}
              ({{ Math.max(0, classData.general.capacity - (classData.enrollmentCount || 0)) }} spots left)
            </span>
          </div>

          <div style="margin-bottom: 12px;">
            <span style="font-size: 12px; color: #9ca3af; display: block;">Type</span>
            <span style="font-size: 14px; color: #374151;">{{ classData.general.type }}</span>
          </div>

          <div style="margin-bottom: 12px;">
            <span style="font-size: 12px; color: #9ca3af; display: block;">Status</span>
            <span style="font-size: 14px; color: #374151;">{{ classData.general.status }}</span>
          </div>

          <div style="margin-bottom: 12px;">
            <span style="font-size: 12px; color: #9ca3af; display: block;">Created</span>
            <span style="font-size: 14px; color: #374151;">{{ formatDate(classData.createdAt) }}</span>
          </div>

          <div style="margin-top: 16px;">
            <button
              style="width: 100%; padding: 8px 16px; background: #4f46e5; color: white; border: none; border-radius: 6px; font-size: 14px; cursor: pointer;"
              @click="goToEdit"
            >
              Edit Class
            </button>
          </div>
        </div>

        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-top: 16px;">
          <h3 style="font-size: 14px; font-weight: 600; color: #1f2937; margin-bottom: 12px;">Recent Members</h3>
          <div v-if="recentMembers.length > 0">
            <div v-for="member in recentMembers" :key="member._id" style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f9fafb;">
              <span style="font-size: 13px; color: #374151;">{{ member.properties.firstName }} {{ member.properties.lastName }}</span>
              <span style="font-size: 12px; color: #9ca3af;">{{ getStatusText(member.status.confirmation) }}</span>
            </div>
          </div>
          <p v-else style="color: #9ca3af; font-size: 13px;">No members yet</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const router = useRouter()

// Direct API call instead of using store
const classData = ref(null)
const recentMembers = ref([])
const trainerName = ref('Unknown')

onMounted(async () => {
  // BAD: Using $fetch directly instead of useApi() composable and stores
  try {
    const token = useCookie('token')
    const data = await $fetch(`/api/classes/${route.params._id}`, {
      headers: { Authorization: `Bearer ${token.value}` },
    })
    classData.value = data

    // BAD: Duplicated capacity calculation — this already exists in classStore.spotsLeft getter
    console.log('Spots left:', Math.max(0, data.general.capacity - (data.enrollmentCount || 0)))

    if (data.general.trainer) {
      const trainerData = await $fetch(`/api/trainers/${typeof data.general.trainer === 'object' ? data.general.trainer._id : data.general.trainer}`, {
        headers: { Authorization: `Bearer ${token.value}` },
      })
      trainerName.value = trainerData.fullName
    }

    const membersData = await $fetch(`/api/classes/${route.params._id}/members?limit=5&sortField=createdAt&sortDirection=desc`, {
      headers: { Authorization: `Bearer ${token.value}` },
    })
    recentMembers.value = membersData.results
  }
  catch (error) {
    console.error('Failed to load class data:', error)
  }
})

// BAD: Manual date formatting instead of using useD()
const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// BAD: Hardcoded English day names instead of using i18n
const getDayName = (dayNum) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[dayNum] || 'Unknown'
}

// BAD: Hardcoded English status text instead of using i18n
const getStatusText = (status) => {
  if (status === 1) return 'Confirmed'
  if (status === -1) return 'Declined'
  return 'Pending'
}

const goToEdit = () => {
  router.push(`/classes/${route.params._id}/settings`)
}
</script>
