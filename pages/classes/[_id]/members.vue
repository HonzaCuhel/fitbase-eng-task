<template>
  <div class="flex flex-1 flex-col">
    <div class="mb-4 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <TextInput
          v-model="search"
          :placeholder="$t('common.search')"
          class="w-64"
          @input="onSearch"
        />
        <div class="flex gap-2">
          <Button
            v-for="filter in statusFilters"
            :key="filter.value"
            :type="membersStore.filters.status === filter.value ? 'primary' : 'regular-outline'"
            size="small"
            @click="membersStore.filterMembers(classId, 'status', membersStore.filters.status === filter.value ? null : filter.value)"
          >
            {{ filter.label }}
          </Button>
        </div>
      </div>
      <div class="flex gap-2">
        <Button @click="openImport">
          {{ $t('common.import') }}
        </Button>
        <Button type="primary" @click="openAddMember">
          {{ $t('member.addMember') }}
        </Button>
      </div>
    </div>

    <div class="mb-6 flex flex-wrap gap-4">
      <StatTile v-for="stat in statTiles" :key="stat.label" :value="String(stat.value)" :label="stat.label" />
    </div>

    <MemberList
      :members="membersStore.members"
      :loading="membersStore.isLoading"
      :class-id="classId"
    />
  </div>
</template>

<script setup>
const route = useRoute()
const t = useT()
useHead({ title: t('class.members') })
const membersStore = useMembersStore()
const dialogStore = useDialogStore()

const classId = computed(() => route.params._id)
const search = ref('')

const statusFilters = computed(() => [
  { value: 1, label: t('member.status.confirmed') },
  { value: 0, label: t('member.status.pending') },
  { value: 2, label: t('member.status.waitlisted') },
  { value: -1, label: t('member.status.declined') },
])

const statTiles = computed(() => [
  { label: t('dashboard.totalMembers'), value: membersStore.stats.total },
  { label: t('member.status.confirmed'), value: membersStore.stats.confirmed },
  { label: t('member.status.pending'), value: membersStore.stats.pending },
  { label: t('member.status.waitlisted'), value: membersStore.stats.waitlisted },
  { label: t('member.status.declined'), value: membersStore.stats.declined },
])

const openImport = () => {
  dialogStore.open({
    component: resolveComponent('MemberImport'),
    props: { classId: classId.value },
    title: t('member.importMembers'),
  })
}

const openAddMember = () => {
  dialogStore.open({
    component: resolveComponent('MemberForm'),
    props: { classId: classId.value },
    title: t('member.addMember'),
  })
}

const onSearch = useDebounceFn(() => {
  membersStore.setSearch(classId.value, search.value)
}, 300)

onMounted(() => {
  membersStore.resetMembers()
  membersStore.fetchMembers(classId.value)
})
</script>
