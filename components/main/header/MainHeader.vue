<template>
  <header class="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
    <div class="flex items-center gap-4">
      <button class="text-gray-400 hover:text-gray-600 lg:hidden" @click="generalStore.toggleSidebar()">
        <Icon name="align-justify" class="h-5 w-5" />
      </button>
      <h2 class="text-sm font-medium text-gray-600">{{ gymStore.getDisplayName }}</h2>
    </div>

    <div class="flex items-center gap-4">
      <Select
        :model-value="locale"
        :options="localeOptions"
        class="w-32"
        @update:model-value="(val) => locale = val"
      />

      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-600">{{ authStore.user?.fullName }}</span>
        <button class="text-sm text-gray-400 hover:text-danger" @click="authStore.logout()">
          {{ $t('auth.logout') }}
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
const { locale } = useI18n()
const authStore = useAuthStore()
const gymStore = useGymStore()
const generalStore = useGeneralStore()

const localeOptions = [
  { id: 'en', text: 'English' },
  { id: 'cs', text: 'Čeština' },
  { id: 'es', text: 'Español' },
]
</script>
