<template>
  <div v-loading="loading" :class="{ 'flex-1': loading }">
    <EmptyState v-if="!loading && members.length === 0" :title="$t('class.noMembers')" icon="search-lg" />

    <div v-else-if="!loading" class="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <table class="w-full">
        <thead>
          <tr class="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
            <th class="px-4 py-3">{{ $t('member.firstName') }}</th>
            <th class="px-4 py-3">{{ $t('member.lastName') }}</th>
            <th class="px-4 py-3">{{ $t('member.email') }}</th>
            <th class="px-4 py-3">{{ $t('member.phone') }}</th>
            <th class="px-4 py-3">{{ $t('common.status') }}</th>
            <th class="px-4 py-3">{{ $t('common.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="member in members" :key="member._id" class="border-b border-gray-100 hover:bg-gray-50">
            <td class="px-4 py-3 text-sm">{{ member.properties.firstName }}</td>
            <td class="px-4 py-3 text-sm">{{ member.properties.lastName }}</td>
            <td class="px-4 py-3 text-sm text-gray-500">{{ member.properties.email }}</td>
            <td class="px-4 py-3 text-sm text-gray-500">{{ member.properties.phone || '-' }}</td>
            <td class="px-4 py-3">
              <MemberStatusBadge :status="member.status.confirmation" />
            </td>
            <td class="px-4 py-3">
              <div class="flex gap-2">
                <button
                  v-if="member.status.confirmation !== 1"
                  class="text-xs text-green-600 hover:underline"
                  @click="updateStatus(member._id, 1)"
                >
                  {{ $t('member.status.confirmed') }}
                </button>
                <button
                  v-if="member.status.confirmation !== -1"
                  class="text-xs text-red-600 hover:underline"
                  @click="updateStatus(member._id, -1)"
                >
                  {{ $t('member.status.declined') }}
                </button>
                <button
                  class="text-xs text-gray-400 hover:text-danger hover:underline"
                  @click="removeMember(member._id)"
                >
                  {{ $t('common.delete') }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  members: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  classId: { type: String, required: true },
})

const t = useT()
const modalStore = useModalStore()
const membersStore = useMembersStore()

const updateStatus = async (memberId, confirmation) => {
  try {
    await membersStore.updateMember(props.classId, memberId, {
      status: { confirmation },
    })
  }
  catch (error) {
    const message = error?.data?.error === 'Class is full'
      ? t('errors.classFull')
      : error?.data?.error || t('errors.updateClass')
    useToast().error(message)
  }
}

const removeMember = (memberId) => {
  modalStore.open({
    type: 'danger',
    title: t('member.confirmRemove'),
    onSubmit: async () => {
      await membersStore.deleteMember(props.classId, memberId)
    },
  })
}
</script>
