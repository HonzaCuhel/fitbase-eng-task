<template>
  <Badge :text="$t(`class.status.${status}`)" :type="badgeType" />
</template>

<script setup>
const props = defineProps({
  status: { type: String, required: true },
})

const badgeType = computed(() => {
  const map = {
    published: 'success',
    draft: 'warning',
    archived: 'neutral',
  }
  return map[props.status] || 'neutral'
})
</script>
