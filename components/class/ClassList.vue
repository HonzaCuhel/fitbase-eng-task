<template>
  <div v-loading="loading" :class="{ 'flex-1': loading }">
    <EmptyState v-if="!loading && classes.length === 0" :title="$t('common.noResults')" icon="search-lg" />

    <div v-else-if="!loading" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <ClassCard v-for="cls in classes" :key="cls._id" :class-data="cls" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  classes: { type: Array, required: true },
  loading: { type: Boolean, default: false },
})
</script>
