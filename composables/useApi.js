export const useApi = () => {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()

  const getBaseUrl = () => {
    if (import.meta.server) return `http://localhost:${config.public.apiPort}/api`
    return '/api'
  }

  const getHeaders = () => {
    const headers = {}
    if (authStore.token) {
      headers.Authorization = `Bearer ${authStore.token}`
    }
    return headers
  }

  const isTokenExpired = () => {
    if (!authStore.token) return true
    try {
      const payload = JSON.parse(atob(authStore.token.split('.')[1]))
      return payload.exp * 1000 < Date.now()
    }
    catch {
      return true
    }
  }

  const refreshTokenIfNeeded = async () => {
    if (!authStore.token || !isTokenExpired()) return
    if (!authStore.refresh) {
      authStore.logout()
      return
    }

    try {
      const data = await $fetch(`${getBaseUrl()}/public/users/refresh-token`, {
        method: 'POST',
        body: { refreshToken: authStore.refresh },
      })
      authStore.setAuth({
        token: data.accessToken,
        refresh: data.refreshToken,
      })
    }
    catch {
      authStore.logout()
    }
  }

  const request = async (url, options = {}) => {
    await refreshTokenIfNeeded()

    try {
      return await $fetch(`${getBaseUrl()}${url}`, {
        ...options,
        headers: {
          ...getHeaders(),
          ...options.headers,
        },
      })
    }
    catch (error) {
      if (error?.response?.status === 401) {
        authStore.logout()
      }
      throw error
    }
  }

  return {
    get: (url, params) => request(url, { method: 'GET', params }),
    post: (url, body) => request(url, { method: 'POST', body }),
    put: (url, body) => request(url, { method: 'PUT', body }),
    patch: (url, body) => request(url, { method: 'PATCH', body }),
    delete: (url) => request(url, { method: 'DELETE' }),
  }
}
