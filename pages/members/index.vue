<template>
  <div class="flex flex-1 flex-col">
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-3xl font-bold text-gray-800">{{ $t('member.allMembers') }}</h1>
    </div>

    <div class="mb-4">
      <TextInput
        v-model="search"
        :placeholder="$t('common.search')"
        class="w-64"
        @input="onSearch"
      />
    </div>

    <div v-loading="isLoading" :class="{ 'flex-1': isLoading }">
      <div v-if="!isLoading && members.length === 0" class="py-12 text-center text-gray-400">
        {{ $t('common.noResults') }}
      </div>

      <div v-else-if="!isLoading" class="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
              <th class="px-4 py-3">{{ $t('member.firstName') }}</th>
              <th class="px-4 py-3">{{ $t('member.lastName') }}</th>
              <th class="px-4 py-3">{{ $t('member.email') }}</th>
              <th class="px-4 py-3">{{ $t('class.title') }}</th>
              <th class="px-4 py-3">{{ $t('common.status') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="member in members" :key="member._id" class="border-b border-gray-100">
              <td class="px-4 py-3 text-sm">{{ member.properties.firstName }}</td>
              <td class="px-4 py-3 text-sm">{{ member.properties.lastName }}</td>
              <td class="px-4 py-3 text-sm text-gray-500">{{ member.properties.email }}</td>
              <td class="px-4 py-3 text-sm text-gray-500">{{ member.class?.general?.title || '-' }}</td>
              <td class="px-4 py-3"><MemberStatusBadge :status="member.status.confirmation" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'main',
})

useHead({ title: useT()('member.allMembers') })

const api = useApi()

const members = ref([])
const isLoading = ref(true)
const search = ref('')

const fetchMembers = async () => {
  isLoading.value = true
  try {
    const params = { limit: 100 }
    if (search.value) params.search = search.value
    const data = await api.get('/members', params)
    members.value = data.results
  }
  catch {
    useToast().error(useT()('errors.loadMembers'))
  }
  finally {
    isLoading.value = false
  }
}

const onSearch = useDebounceFn(fetchMembers, 300)

onMounted(fetchMembers)
</script>
