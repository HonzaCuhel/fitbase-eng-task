<template>
  <Badge :text="$t(`member.status.${statusKey}`)" :type="badgeType" />
</template>

<script setup>
const props = defineProps({
  status: { type: Number, required: true },
})

const statusKey = computed(() => {
  if (props.status === 1) return 'confirmed'
  if (props.status === -1) return 'declined'
  return 'pending'
})

const badgeType = computed(() => {
  const map = {
    confirmed: 'success',
    pending: 'warning',
    declined: 'critical',
  }
  return map[statusKey.value] || 'neutral'
})
</script>
