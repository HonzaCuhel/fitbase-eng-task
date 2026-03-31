<template>
  <div class="rounded-lg border border-gray-200 bg-white p-5">
    <div class="mb-4 flex items-center justify-between">
      <h3 class="text-sm font-semibold text-gray-800">{{ $t('ai.insights') }}</h3>
      <Button size="small" :loading="isGenerating" @click="generate">
        {{ isGenerating ? $t('ai.generating') : $t('ai.getInsights') }}
      </Button>
    </div>

    <div v-if="insights.length" class="space-y-3">
      <div
        v-for="(insight, i) in insights"
        :key="i"
        class="rounded-md border p-3"
        :class="{
          'border-yellow-200 bg-yellow-50': insight.type === 'warning',
          'border-blue-200 bg-blue-50': insight.type === 'info',
          'border-green-200 bg-green-50': insight.type === 'suggestion',
        }"
      >
        <p class="text-sm font-medium text-gray-800">{{ getMessage(insight) }}</p>
        <p v-if="insight.recommendedAction" class="mt-1 text-xs text-gray-500">
          👉 {{ insight.recommendedAction }}
        </p>
      </div>
    </div>

    <p v-else-if="!isGenerating" class="text-sm text-gray-400">{{ $t('ai.noInsights') }}</p>
  </div>
</template>

<script setup>
const props = defineProps({
  classData: { type: Object, required: true },
  classId: { type: String, required: true },
})

const authStore = useAuthStore()
const membersStore = useMembersStore()
const insights = ref([])
const isGenerating = ref(false)

const typeEmoji = {
  warning: '⚠️',
  info: 'ℹ️',
  suggestion: '💡',
}

const hasKnownEmojiPrefix = (message = '') => {
  const trimmed = message.trim()
  return ['⚠️', 'ℹ️', '💡'].some((emoji) => trimmed.startsWith(emoji))
}

const getMessage = (insight) => {
  if (!insight?.message) return ''
  if (hasKnownEmojiPrefix(insight.message)) return insight.message
  return `${typeEmoji[insight.type] || 'ℹ️'} ${insight.message}`
}

const generate = async () => {
  isGenerating.value = true
  insights.value = []

  try {
    const allMembers = await membersStore.fetchMembersForExport(props.classId)

    const memberData = allMembers.map((m) => ({
      status: { confirmation: m.status.confirmation },
      enrolledAt: m.enrolledAt,
    }))

    const response = await fetch('/api/ai/enrollment-insights', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authStore.token}`,
      },
      body: JSON.stringify({
        className: props.classData.general.title,
        classType: props.classData.general.type,
        trainerName: props.classData.general.trainer?.fullName,
        capacity: props.classData.general.capacity,
        enrollmentCount: props.classData.enrollmentCount || 0,
        waitlistCount: props.classData.waitlistCount || 0,
        schedule: (props.classData.schedule || []).map((s) => ({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
        members: memberData,
      }),
    })

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`)
    }
    if (!response.body) {
      throw new Error('No response body')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const partial = JSON.parse(line)
          if (partial.insights) insights.value = partial.insights
        }
        catch (parseError) {
          void parseError
        }
      }
    }

    if (buffer.trim()) {
      try {
        const partial = JSON.parse(buffer)
        if (partial.insights) insights.value = partial.insights
      }
      catch (parseError) {
        void parseError
      }
    }
  }
  catch (error) {
    useToast().error(error?.message || useT()('errors.generateDescription'))
  }
  finally {
    isGenerating.value = false
  }
}
</script>
