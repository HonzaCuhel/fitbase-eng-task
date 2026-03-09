export const useGeneralStore = defineStore('general', {
  state: () => ({
    isSidebarCollapsed: false,
    isLoading: false,
  }),

  actions: {
    toggleSidebar() {
      this.isSidebarCollapsed = !this.isSidebarCollapsed
    },

    setLoading(value) {
      this.isLoading = value
    },
  },
})
