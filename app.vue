<template>
  <Html :lang="locale">
    <Body>
      <el-config-provider :locale="elementLocale">
        <NuxtLayout v-if="!isLoading">
          <NuxtPage />
        </NuxtLayout>
        <div v-else v-loading="true" class="h-screen" />
      </el-config-provider>
    </Body>
  </Html>
</template>

<script setup>
import en from 'element-plus/es/locale/lang/en'
import cs from 'element-plus/es/locale/lang/cs'
import es from 'element-plus/es/locale/lang/es'
import dayjs from 'dayjs'

const { locale } = useI18n()
const gymStore = useGymStore()
const authStore = useAuthStore()

const elementLocales = { en, cs, es }
const elementLocale = computed(() => elementLocales[locale.value] || en)

const isLoading = ref(true)

onMounted(async () => {
  if (!authStore.token) {
    authStore.restoreFromCookies()
  }
  if (authStore.token && !authStore.user) {
    await authStore.fetchUser()
  }
  if (authStore.isLoggedIn) {
    await gymStore.fetch()
  }
  isLoading.value = false
})

watch(locale, (val) => {
  dayjs.locale(val)
})
</script>
