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
        :model-value="selectedLocale"
        :options="localeOptions"
        class="w-32"
        @update:model-value="onLocaleChange"
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
const { locale, setLocale } = useI18n()
const authStore = useAuthStore()
const gymStore = useGymStore()
const generalStore = useGeneralStore()

const localeOptions = [
  { id: 'en', text: 'English' },
  { id: 'cs', text: 'Čeština' },
  { id: 'es', text: 'Español' },
]

const selectedLocale = computed(() => locale.value)

const onLocaleChange = async (val) => {
  if (!val || val === locale.value) return

  await setLocale(val)

  if (authStore.user && authStore.user.locale !== val) {
    const previousLocale = authStore.user.locale
    authStore.user.locale = val

    try {
      await useApi().put('/users/me', { locale: val })
    }
    catch {
      authStore.user.locale = previousLocale
    }
  }
}
</script>
