export const useClassesStore = defineStore('classes', {
  state: () => ({
    classes: [],
    total: 0,
    page: 1,
    limit: 20,
    search: '',
    sortField: 'createdAt',
    sortDirection: 'desc',
    filters: {
      status: null,
      trainer: null,
    },
    isLoading: false,
  }),

  actions: {
    async fetchClasses() {
      this.isLoading = true
      try {
        const params = {
          page: this.page,
          limit: this.limit,
          sortField: this.sortField,
          sortDirection: this.sortDirection,
        }
        if (this.search) params.search = this.search
        if (this.filters.status) params.status = this.filters.status
        if (this.filters.trainer) params.trainer = this.filters.trainer

        const data = await useApi().get('/classes', params)
        this.classes = data.results
        this.total = data.total
        return data
      }
      catch (error) {
        const { $i18n } = useNuxtApp()
        useToast().error($i18n.t('errors.loadClasses'))
        throw error
      }
      finally {
        this.isLoading = false
      }
    },

    async addClass(classData) {
      const data = await useApi().post('/classes', classData)
      this.classes.unshift(data)
      this.total++
      const { $i18n } = useNuxtApp()
      useToast().success($i18n.t('class.created'))
      return data
    },

    setSearch(search) {
      this.search = search
      this.page = 1
      this.fetchClasses()
    },

    setSort(field, direction) {
      this.sortField = field
      this.sortDirection = direction
      this.fetchClasses()
    },

    setFilter(key, value) {
      this.filters[key] = value
      this.page = 1
      this.fetchClasses()
    },

    setPage(page) {
      this.page = page
      this.fetchClasses()
    },

    resetFilters() {
      this.search = ''
      this.filters = { status: null, trainer: null }
      this.page = 1
      this.fetchClasses()
    },
  },
})
