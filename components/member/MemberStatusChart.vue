<template>
  <div class="shrink-0 rounded-lg border border-gray-200 bg-white p-1.5">
    <div class="relative h-9 w-9">
      <svg viewBox="0 0 36 36" class="h-full w-full -rotate-90">
        <circle cx="18" cy="18" r="14" fill="none" stroke="#f3f4f6" stroke-width="4" />
        <circle
          v-for="seg in segments"
          :key="seg.key"
          cx="18" cy="18" r="14"
          fill="none"
          :stroke="seg.hex"
          stroke-width="4"
          stroke-linecap="round"
          :stroke-dasharray="`${seg.arc} ${circumference - seg.arc}`"
          :stroke-dashoffset="`${-seg.offset}`"
          class="transition-all duration-300"
        />
      </svg>
      <div class="absolute inset-0 flex items-center justify-center">
        <span class="text-[10px] font-semibold leading-none text-gray-700">{{ total }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  stats: { type: Object, required: true },
})

const t = useT()

const circumference = 2 * Math.PI * 14
const total = computed(() => props.stats.total || 0)

const colorMap = {
  confirmed: '#4ade80',
  pending: '#facc15',
  waitlisted: '#60a5fa',
  declined: '#f87171',
}

const segments = computed(() => {
  const items = [
    { key: 'confirmed', count: props.stats.confirmed, label: t('member.status.confirmed') },
    { key: 'pending', count: props.stats.pending, label: t('member.status.pending') },
    { key: 'waitlisted', count: props.stats.waitlisted, label: t('member.status.waitlisted') },
    { key: 'declined', count: props.stats.declined, label: t('member.status.declined') },
  ].filter((s) => s.count > 0)

  let offset = 0
  return items.map((item) => {
    const percent = total.value > 0 ? Math.round((item.count / total.value) * 100) : 0
    const arc = total.value > 0 ? (item.count / total.value) * circumference : 0
    const seg = { ...item, hex: colorMap[item.key], percent, arc, offset }
    offset += arc
    return seg
  })
})
</script>
