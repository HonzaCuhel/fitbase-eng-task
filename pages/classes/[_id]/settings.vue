<template>
  <div v-if="classStore.class" class="max-w-2xl">
    <h2 class="mb-4 text-lg font-semibold text-gray-800">{{ $t('class.settings') }}</h2>

    <ClassForm :class-data="classStore.class" :class-id="classId" mode="edit" />

    <div class="mt-12 border-t border-gray-200 pt-6">
      <h3 class="mb-2 text-sm font-medium text-danger">{{ $t('class.dangerZone') }}</h3>
      <p class="mb-4 text-sm text-gray-500">{{ $t('class.deleteWarning') }}</p>
      <Button type="danger" @click="onDelete">
        {{ $t('common.delete') }} {{ $t('class.title').toLowerCase() }}
      </Button>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const router = useRouter()
const classStore = useClassStore()
const t = useT()
const modalStore = useModalStore()
useHead({ title: t('class.settings') })

const classId = computed(() => route.params._id)

const onDelete = () => {
  modalStore.open({
    type: 'danger',
    title: t('class.confirmDelete', { title: classStore.getTitle }),
    description: t('class.deleteWarning'),
    onSubmit: async () => {
      await classStore.deleteClass(classId.value)
      router.push('/classes')
    },
  })
}
</script>
