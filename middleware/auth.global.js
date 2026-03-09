export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const authStore = useAuthStore()

  if (!authStore.token) {
    authStore.restoreFromCookies()
  }

  const publicPages = ['login', 'register']
  const isPublicPage = publicPages.some((page) => to.name?.toString().includes(page))
  const isAppPage = to.path.startsWith('/app/')
  const isErrorPage = to.name === 'error'

  if (isAppPage || isErrorPage) return

  if (isPublicPage) {
    if (authStore.isLoggedIn) {
      return navigateTo('/')
    }
    return
  }

  if (!authStore.token) {
    if (to.path !== '/') {
      sessionStorage.setItem('redirectPath', to.fullPath)
    }
    return navigateTo('/login')
  }

  if (authStore.token && !authStore.user) {
    authStore.fetchUser()
  }
})
