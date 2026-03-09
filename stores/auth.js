function setCookie(name, value, days = 14) {
  if (import.meta.server) return
  const maxAge = days * 24 * 60 * 60
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`
}

function getCookie(name) {
  if (import.meta.server) return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function deleteCookie(name) {
  if (import.meta.server) return
  document.cookie = `${name}=; path=/; max-age=0`
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    refresh: null,
  }),

  getters: {
    isLoggedIn: (state) => !!state.token && !!state.user,
  },

  actions: {
    setAuth({ user, token, refresh }) {
      if (user) this.user = user
      if (token) this.token = token
      if (refresh) this.refresh = refresh

      if (token) setCookie('token', token)
      if (refresh) setCookie('refresh', refresh)
    },

    async login(email, password) {
      try {
        const data = await useApi().post('/public/users/login', { email, password })
        this.setAuth({
          user: data.user,
          token: data.accessToken,
          refresh: data.refreshToken,
        })
        return data
      }
      catch (error) {
        const { $i18n } = useNuxtApp()
        const message = error?.data?.error || $i18n.t('auth.loginFailed')
        useToast().error(message)
        throw error
      }
    },

    async register(fullName, email, password, gymName) {
      try {
        const data = await useApi().post('/public/users/register', { fullName, email, password, gymName })
        this.setAuth({
          user: data.user,
          token: data.accessToken,
          refresh: data.refreshToken,
        })
        return data
      }
      catch (error) {
        const { $i18n } = useNuxtApp()
        const message = error?.data?.error || $i18n.t('auth.registerFailed')
        useToast().error(message)
        throw error
      }
    },

    async fetchUser() {
      try {
        const user = await useApi().get('/users/me')
        this.user = user
        return user
      }
      catch {
        this.logout()
      }
    },

    logout() {
      if (this.refresh) {
        useApi().post('/users/logout', { refreshToken: this.refresh }).catch(() => {})
      }

      this.user = null
      this.token = null
      this.refresh = null

      deleteCookie('token')
      deleteCookie('refresh')

      navigateTo('/login')
    },

    restoreFromCookies() {
      const token = getCookie('token')
      const refresh = getCookie('refresh')

      if (token) this.token = token
      if (refresh) this.refresh = refresh
    },
  },
})
