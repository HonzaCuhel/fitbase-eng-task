<template>
  <div class="flex h-screen overflow-hidden bg-gray-50">
    <MainSidebar />
    <div class="flex flex-1 flex-col overflow-hidden">
      <MainHeader />
      <main class="flex flex-1 flex-col overflow-y-auto p-6">
        <slot />
      </main>
    </div>

    <Modal />

    <Dialog
      v-model="dialogStore.isOpen"
      @close="dialogStore.close()"
    >
      <template #header="{ close }">
        <div class="flex items-center justify-between p-4 sm:p-6 pb-0 sm:pb-0">
          <h2 class="text-lg font-semibold">{{ dialogStore.title }}</h2>
          <Button content-icon="x-close" @click="close" />
        </div>
      </template>
      <component :is="dialogStore.component" v-bind="dialogStore.props" />
    </Dialog>
  </div>
</template>

<script setup>
useHead({
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

const dialogStore = useDialogStore()
const authStore = useAuthStore()
const { locale } = useI18n()

if (authStore.user?.locale) {
  locale.value = authStore.user.locale
}
</script>
