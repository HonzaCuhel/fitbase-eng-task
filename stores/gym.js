export const useGymStore = defineStore('gym', {
  state: () => ({
    name: '',
    domain: '',
    branding: {
      logo: '',
      primaryColor: '#4f46e5',
      font: 'Inter',
    },
    settings: {
      timezone: 'America/New_York',
      defaultLocale: 'en',
      currency: 'USD',
    },
    contact: {
      email: '',
      phone: '',
      address: '',
      website: '',
    },
  }),

  getters: {
    getDisplayName: (state) => state.name || 'FitBase',
    getCurrency: (state) => state.settings.currency,
  },

  actions: {
    async fetch() {
      try {
        const data = await useApi().get('/gym')
        this.$patch(data)
        return data
      }
      catch {
        // Gym not set up yet — that's fine
      }
    },

    async update(data) {
      const { $i18n } = useNuxtApp()
      try {
        const result = await useApi().put('/gym', data)
        this.$patch(result)
        useToast().success($i18n.t('gym.updated'))
        return result
      }
      catch (error) {
        useToast().error(error?.data?.error || $i18n.t('errors.updateGym'))
        throw error
      }
    },
  },
})
