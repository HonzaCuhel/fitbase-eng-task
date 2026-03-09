<template>
  <div class="rounded-lg border border-gray-200 bg-white p-5">
    <div class="mb-3 flex items-start justify-between">
      <div>
        <h3 class="text-base font-semibold text-gray-800">{{ trainer.fullName }}</h3>
        <p class="text-sm text-gray-400">{{ trainer.email }}</p>
      </div>
      <div class="flex gap-1">
        <Button size="small" @click="$emit('edit', trainer)">{{ $t('common.edit') }}</Button>
        <Button size="small" type="danger" @click="$emit('delete', trainer)">{{ $t('common.delete') }}</Button>
      </div>
    </div>

    <p v-if="trainer.bio" class="mb-3 text-sm text-gray-500">{{ trainer.bio }}</p>

    <div v-if="trainer.specialties?.length" class="flex flex-wrap gap-1">
      <span
        v-for="spec in trainer.specialties"
        :key="spec"
        class="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
      >
        {{ spec }}
      </span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  trainer: { type: Object, required: true },
})

defineEmits(['edit', 'delete'])
</script>
