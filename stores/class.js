export const useClassStore = defineStore('class', {
  state: () => ({
    class: null,
    isLoading: false,
  }),

  getters: {
    getTitle: (state) => state.class?.general?.title || '',
    getCapacity: (state) => state.class?.general?.capacity || 0,
    getEnrollmentCount: (state) => state.class?.enrollmentCount || 0,
    isFull: (state) => (state.class?.enrollmentCount || 0) >= (state.class?.general?.capacity || Infinity),
    spotsLeft: (state) => Math.max(0, (state.class?.general?.capacity || 0) - (state.class?.enrollmentCount || 0)),
    isPublished: (state) => state.class?.general?.status === 'published',
  },

  actions: {
    async fetch(classId) {
      this.isLoading = true
      try {
        const data = await useApi().get(`/classes/${classId}`)
        this.class = data
        return data
      }
      catch (error) {
        const { $i18n } = useNuxtApp()
        useToast().error($i18n.t('errors.loadClass'))
        throw error
      }
      finally {
        this.isLoading = false
      }
    },

    async update(classId, data) {
      const { $i18n } = useNuxtApp()
      try {
        const result = await useApi().put(`/classes/${classId}`, data)
        this.class = result
        useToast().success($i18n.t('class.updated'))
        return result
      }
      catch (error) {
        useToast().error(error?.data?.error || $i18n.t('errors.updateClass'))
        throw error
      }
    },

    async deleteClass(classId) {
      await useApi().delete(`/classes/${classId}`)
      this.class = null
      const { $i18n } = useNuxtApp()
      useToast().success($i18n.t('class.deleted'))
    },

    async updateSchedule(classId, sessionIndex, data) {
      const res = await useApi().put(`/classes/${classId}/schedule/${sessionIndex}`, data)
      this.class.schedule.splice(sessionIndex, 1, res)
      return res
    },

    async addScheduleSession(classId, data) {
      const res = await useApi().post(`/classes/${classId}/schedule`, data)
      this.class.schedule.push(res)
      return res
    },

    async removeScheduleSession(classId, sessionIndex) {
      await useApi().delete(`/classes/${classId}/schedule/${sessionIndex}`)
      this.class.schedule.splice(sessionIndex, 1)
    },

    reset() {
      this.class = null
      this.isLoading = false
    },
  },
})
