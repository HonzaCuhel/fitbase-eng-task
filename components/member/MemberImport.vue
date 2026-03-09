<template>
  <div>
    <p class="mb-4 text-sm text-gray-500">
      {{ $t('member.importDescription') }}
    </p>

    <input
      ref="fileInput"
      type="file"
      accept=".csv"
      class="mb-4 block w-full text-sm text-gray-500 file:mr-4 file:rounded file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary"
      @change="onFileChange"
    />

    <div v-if="preview.length > 0" class="mb-4">
      <p class="mb-2 text-sm font-medium text-gray-700">Preview ({{ preview.length }} members)</p>
      <div class="max-h-48 overflow-y-auto rounded border border-gray-200 bg-gray-50 p-3 text-xs">
        <div v-for="(row, i) in preview.slice(0, 5)" :key="i" class="border-b border-gray-100 py-1">
          {{ row.firstName }} {{ row.lastName }} - {{ row.email }}
        </div>
        <div v-if="preview.length > 5" class="pt-1 text-gray-400">...and {{ preview.length - 5 }} more</div>
      </div>
    </div>

    <div class="flex justify-end gap-2">
      <Button @click="dialogStore.close()">{{ $t('common.cancel') }}</Button>
      <Button type="primary" :loading="isImporting" :disabled="preview.length === 0" @click="onImport">
        {{ $t('common.import') }} ({{ preview.length }})
      </Button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  classId: { type: String, required: true },
})

const membersStore = useMembersStore()
const dialogStore = useDialogStore()

const preview = ref([])
const isImporting = ref(false)

const onFileChange = (e) => {
  const file = e.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (event) => {
    const lines = event.target.result.split('\n').filter(Boolean)
    const headers = lines[0].split(',').map((h) => h.trim())

    preview.value = lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.trim())
      const row = {}
      headers.forEach((h, i) => { row[h] = values[i] || '' })
      return row
    }).filter((row) => row.email)
  }
  reader.readAsText(file)
}

const onImport = async () => {
  isImporting.value = true
  try {
    await membersStore.addMembersMany(props.classId, preview.value)
    await membersStore.fetchMembers(props.classId)
    dialogStore.close()
  }
  finally {
    isImporting.value = false
  }
}
</script>
