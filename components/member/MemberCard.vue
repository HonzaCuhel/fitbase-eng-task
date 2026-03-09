<template>
  <div class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
    <div>
      <h4 class="text-sm font-medium text-gray-800">
        {{ member.properties.firstName }} {{ member.properties.lastName }}
      </h4>
      <p class="text-xs text-gray-400">{{ member.properties.email }}</p>
    </div>
    <MemberStatusBadge :status="member.status.confirmation" />
  </div>
</template>

<script setup>
defineProps({
  member: { type: Object, required: true },
})
</script>
