export const useMemberAppStore = defineStore('memberApp', {
  state: () => ({
    gym: null,
    classes: [],
    selectedClass: null,
    isLoading: false,
  }),

  getters: {
    publishedClasses: (state) => state.classes.filter((c) => c.general.status === 'published'),
  },

  actions: {
    async fetchPublicClasses() {
      this.isLoading = true
      try {
        const data = await $fetch('/api/public/classes')
        this.classes = data.results
        return data
      }
      catch {
        useToast().error(useNuxtApp().$i18n.t('errors.loadPublicClasses'))
      }
      finally {
        this.isLoading = false
      }
    },

    async fetchPublicClass(classId) {
      try {
        const data = await $fetch(`/api/public/classes/${classId}`)
        this.selectedClass = data
        return data
      }
      catch {
        useToast().error(useNuxtApp().$i18n.t('errors.loadPublicClass'))
      }
    },

    async enrollPublic(classId, memberData) {
      const data = await $fetch(`/api/public/classes/${classId}/enroll`, {
        method: 'POST',
        body: {
          properties: memberData,
          status: { confirmation: 0, addMethod: 'publicRegistration' },
        },
      })
      return data
    },
  },
})
