export const useEnrollmentsStore = defineStore('enrollments', {
  state: () => ({
    enrollments: [],
    total: 0,
    isLoading: false,
  }),

  actions: {
    async fetchEnrollments(classId) {
      this.isLoading = true
      try {
        const data = await useApi().get(`/classes/${classId}/members`, {
          limit: 200,
          sortField: 'enrolledAt',
          sortDirection: 'desc',
        })
        this.enrollments = data.results
        this.total = data.total
        return data
      }
      catch (error) {
        const { $i18n } = useNuxtApp()
        useToast().error($i18n.t('errors.loadEnrollments'))
        throw error
      }
      finally {
        this.isLoading = false
      }
    },

    async enrollMember(classId, memberData) {
      const data = await useApi().post(`/classes/${classId}/members`, {
        properties: memberData,
        status: { confirmation: 1, addMethod: 'singleAdd' },
      })
      this.enrollments.unshift(data)
      this.total++
      const { $i18n } = useNuxtApp()
      useToast().success($i18n.t('enrollment.enrolled'))
      return data
    },

    async unenrollMember(classId, memberId) {
      await useApi().delete(`/classes/${classId}/members/${memberId}`)
      this.enrollments = this.enrollments.filter((e) => e._id !== memberId)
      this.total--
      const { $i18n } = useNuxtApp()
      useToast().success($i18n.t('enrollment.unenrolled'))
    },

    async updateStatus(classId, memberId, confirmation) {
      const result = await useApi().put(`/classes/${classId}/members/${memberId}`, {
        status: { confirmation },
      })
      const index = this.enrollments.findIndex((e) => e._id === memberId)
      if (index !== -1) this.enrollments.splice(index, 1, result)
      return result
    },
  },
})
