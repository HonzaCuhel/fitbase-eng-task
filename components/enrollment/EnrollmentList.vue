<template>
  <div class="overflow-hidden rounded-lg border border-gray-200 bg-white">
    <table class="w-full">
      <thead>
        <tr class="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
          <th class="px-4 py-3">{{ $t('member.firstName') }}</th>
          <th class="px-4 py-3">{{ $t('member.lastName') }}</th>
          <th class="px-4 py-3">{{ $t('member.email') }}</th>
          <th class="px-4 py-3">{{ $t('common.status') }}</th>
          <th class="px-4 py-3">{{ $t('common.actions') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="enrollment in enrollments" :key="enrollment._id" class="border-b border-gray-100">
          <td class="px-4 py-3 text-sm">{{ enrollment.properties.firstName }}</td>
          <td class="px-4 py-3 text-sm">{{ enrollment.properties.lastName }}</td>
          <td class="px-4 py-3 text-sm text-gray-500">{{ enrollment.properties.email }}</td>
          <td class="px-4 py-3">
            <EnrollmentStatusBadge :status="enrollment.status.confirmation" />
          </td>
          <td class="px-4 py-3">
            <button
              class="text-xs text-danger hover:underline"
              @click="$emit('unenroll', enrollment._id)"
            >
              {{ $t('common.delete') }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
defineProps({
  enrollments: { type: Array, required: true },
})

defineEmits(['unenroll'])
</script>
