<template>
  <div>
    <div v-if="schedule.length === 0 && !showAddForm" class="py-8 text-center text-gray-400">
      {{ $t('common.noResults') }}
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="(session, index) in schedule"
        :key="index"
        class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
      >
        <div class="flex items-center gap-4">
          <span class="text-sm font-medium text-gray-800">
            {{ $t(`schedule.days.${session.dayOfWeek}`) }}
          </span>
          <span class="text-sm text-gray-500">
            {{ session.startTime }} - {{ session.endTime }}
          </span>
          <span v-if="session.room" class="text-xs text-gray-400">{{ session.room }}</span>
        </div>

        <div class="flex gap-2">
          <Button size="small" @click="editSession(index)">{{ $t('common.edit') }}</Button>
          <Button size="small" type="danger" @click="removeSession(index)">{{ $t('common.delete') }}</Button>
        </div>
      </div>
    </div>

    <div v-if="showAddForm || editingIndex !== null" class="mt-4 rounded-lg border border-gray-200 bg-white p-4">
      <h3 class="mb-3 text-sm font-medium text-gray-700">
        {{ editingIndex !== null ? $t('common.edit') : $t('schedule.addSession') }}
      </h3>
      <div class="grid grid-cols-4 gap-3">
        <InputBlock :label="$t('schedule.dayOfWeek')">
          <Select v-model="sessionForm.dayOfWeek" :options="dayOptions" />
        </InputBlock>
        <InputBlock :label="$t('schedule.startTime')">
          <TextInput v-model="sessionForm.startTime" type="time" />
        </InputBlock>
        <InputBlock :label="$t('schedule.endTime')">
          <TextInput v-model="sessionForm.endTime" type="time" />
        </InputBlock>
        <InputBlock :label="$t('schedule.room')">
          <TextInput v-model="sessionForm.room" />
        </InputBlock>
      </div>
      <div class="mt-3 flex justify-end gap-2">
        <Button size="small" @click="cancelForm">{{ $t('common.cancel') }}</Button>
        <Button size="small" type="primary" @click="saveSession">{{ $t('common.save') }}</Button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  schedule: { type: Array, required: true },
  classId: { type: String, required: true },
  showAddForm: { type: Boolean, default: false },
})

const emit = defineEmits(['closeAdd'])
const classStore = useClassStore()

const t = useT()

const dayOptions = computed(() => Array.from({ length: 7 }, (_, i) => ({ id: i, text: t(`schedule.days.${i}`) })))

const editingIndex = ref(null)
const sessionForm = ref({
  dayOfWeek: 1,
  startTime: '09:00',
  endTime: '10:00',
  room: '',
})

const editSession = (index) => {
  editingIndex.value = index
  const session = props.schedule[index]
  sessionForm.value = { ...session }
}

const cancelForm = () => {
  editingIndex.value = null
  emit('closeAdd')
  sessionForm.value = { dayOfWeek: 1, startTime: '09:00', endTime: '10:00', room: '' }
}

const saveSession = async () => {
  if (editingIndex.value !== null) {
    await classStore.updateSchedule(props.classId, editingIndex.value, sessionForm.value)
    editingIndex.value = null
  }
  else {
    await classStore.addScheduleSession(props.classId, sessionForm.value)
    emit('closeAdd')
  }
  sessionForm.value = { dayOfWeek: 1, startTime: '09:00', endTime: '10:00', room: '' }
}

const removeSession = async (index) => {
  await classStore.removeScheduleSession(props.classId, index)
}
</script>
