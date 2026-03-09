<template>
  <Badge :text="$t(`enrollment.status.${statusKey}`)" :type="badgeType" />
</template>

<script setup>
const props = defineProps({
  status: { type: Number, required: true },
})

const statusKey = computed(() => {
  if (props.status === 1) return 'enrolled'
  if (props.status === -1) return 'declined'
  return 'waitlisted'
})

const badgeType = computed(() => {
  const map = {
    enrolled: 'success',
    waitlisted: 'warning',
    declined: 'critical',
  }
  return map[statusKey.value] || 'neutral'
})
</script>
