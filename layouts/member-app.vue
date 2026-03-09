<template>
  <div class="min-h-screen bg-white">
    <header class="border-b border-gray-200 bg-white px-6 py-4">
      <div class="mx-auto flex max-w-5xl items-center justify-between">
        <MainLogo />
        <nav class="flex items-center gap-4">
          <NuxtLink :to="`/app/${gymSlug}`" class="text-sm text-gray-600 hover:text-gray-900">
            {{ $t('app.browseClasses') }}
          </NuxtLink>
        </nav>
      </div>
    </header>
    <main class="mx-auto max-w-5xl px-6 py-8">
      <slot />
    </main>
    <footer class="border-t border-gray-100 px-6 py-6 text-center text-xs text-gray-400">
      {{ $t('app.poweredBy') }} FitBase
    </footer>
  </div>
</template>

<script setup>
const route = useRoute()
const gymSlug = computed(() => route.params.gym || '')
</script>
