<template>
  <div>
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-800">{{ $t('schedule.title') }}</h2>
      <Button type="primary" @click="showAddForm = true">
        {{ $t('schedule.addSession') }}
      </Button>
    </div>

    <ClassSchedule
      v-if="classStore.class"
      :schedule="classStore.class.schedule"
      :class-id="classId"
      :show-add-form="showAddForm"
      @close-add="showAddForm = false"
    />
  </div>
</template>

<script setup>
const route = useRoute()
const classStore = useClassStore()
const t = useT()
useHead({ title: t('class.schedule') })

const classId = computed(() => route.params._id)
const showAddForm = ref(false)
</script>
