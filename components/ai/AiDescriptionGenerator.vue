<template>
  <div class="mt-2">
    <Button
      size="small"
      :loading="isGenerating"
      :disabled="!title"
      @click="generate"
    >
      {{ isGenerating ? $t('class.generating') : $t('class.generateDescription') }}
    </Button>
  </div>
</template>

<script setup>
const props = defineProps({
  title: { type: String, default: '' },
  type: { type: String, default: '' },
  trainerName: { type: String, default: '' },
})

const emit = defineEmits(['generated'])
const authStore = useAuthStore()

const isGenerating = ref(false)

const generate = async () => {
  if (!props.title) return

  isGenerating.value = true
  let fullText = ''

  try {
    const response = await fetch('/api/ai/generate-description', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`,
      },
      body: JSON.stringify({
        title: props.title,
        type: props.type,
        trainerName: props.trainerName,
      }),
    })

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      fullText += chunk
      emit('generated', fullText)
    }
  }
  catch {
    useToast().error(useT()('errors.generateDescription'))
  }
  finally {
    isGenerating.value = false
  }
}
</script>
