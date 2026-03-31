export const useMembersStore = defineStore('members', {
  state: () => ({
    members: [],
    total: 0,
    stats: { total: 0, confirmed: 0, pending: 0, declined: 0, waitlisted: 0 },
    page: 1,
    limit: 50,
    search: '',
    sortField: 'createdAt',
    sortDirection: 'desc',
    filters: {
      status: null,
    },
    isLoading: false,
  }),

  actions: {
    resetMembers() {
      this.members = []
      this.total = 0
      this.stats = { total: 0, confirmed: 0, pending: 0, declined: 0, waitlisted: 0 }
      this.page = 1
      this.search = ''
      this.filters = { status: null }
    },

    async fetchMembers(classId, { silent = false } = {}) {
      if (!silent) this.isLoading = true
      try {
        const params = {
          page: this.page,
          limit: this.limit,
          sortField: this.sortField,
          sortDirection: this.sortDirection,
        }
        if (this.search) params.search = this.search
        if (this.filters.status !== null) params.status = this.filters.status

        const data = await useApi().get(`/classes/${classId}/members`, params)
        this.members = data.results
        this.total = data.total
        this.stats = data.stats
        return data
      }
      catch (error) {
        const { $i18n } = useNuxtApp()
        useToast().error($i18n.t('errors.loadMembers'))
        throw error
      }
      finally {
        this.isLoading = false
      }
    },

    async addMember(classId, memberData) {
      const data = await useApi().post(`/classes/${classId}/members`, memberData)
      this.members.unshift(data)
      this.total++
      const { $i18n } = useNuxtApp()
      useToast().success($i18n.t('member.added'))
      return data
    },

    async addMembersMany(classId, members) {
      const data = await useApi().post(`/classes/${classId}/members/batch`, { members })
      const { $i18n } = useNuxtApp()
      useToast().success($i18n.t('member.imported', { count: data.total }))
      return data
    },

    async updateMember(classId, memberId, data) {
      const result = await useApi().put(`/classes/${classId}/members/${memberId}`, data)
      const index = this.members.findIndex((m) => m._id === memberId)
      if (index !== -1) this.members.splice(index, 1, result)
      if (data.status?.confirmation === -1 || data.status?.confirmation === 1) {
        await this.fetchMembers(classId, { silent: true }).catch(() => {})
      }
      return result
    },

    async deleteMember(classId, memberId) {
      await useApi().delete(`/classes/${classId}/members/${memberId}`)
      const { $i18n } = useNuxtApp()
      useToast().success($i18n.t('member.removed'))
      await this.fetchMembers(classId, { silent: true }).catch(() => {})
    },

    async fetchMembersForExport(classId) {
      if (!classId || classId === 'undefined') {
        throw new Error('Class ID is required for export')
      }
      const data = await useApi().get(`/classes/${classId}/members/export`)
      return data.results
    },

    formatMembersForExport(members) {
      const { $i18n } = useNuxtApp()
      const statusMap = {
        1: $i18n.t('member.status.confirmed'),
        0: $i18n.t('member.status.pending'),
        2: $i18n.t('member.status.waitlisted'),
        '-1': $i18n.t('member.status.declined'),
      }

      return members.map((m) => ({
        firstName: m.properties.firstName,
        lastName: m.properties.lastName,
        email: m.properties.email,
        phone: m.properties.phone || '',
        status: statusMap[m.status.confirmation] ?? $i18n.t('member.status.pending'),
        enrolledAt: m.enrolledAt,
      }))
    },

    setSearch(classId, search) {
      this.search = search
      this.page = 1
      this.fetchMembers(classId)
    },

    sortMembers(classId, field, direction) {
      this.sortField = field
      this.sortDirection = direction
      this.fetchMembers(classId)
    },

    filterMembers(classId, key, value) {
      this.filters[key] = value
      this.page = 1
      this.fetchMembers(classId)
    },
  },
})
