export const useDialogStore = defineStore('dialog', {
  state: () => ({
    isOpen: false,
    component: null,
    props: {},
    title: '',
  }),

  actions: {
    open({ component, props = {}, title = '' }) {
      this.component = component
      this.props = props
      this.title = title
      this.isOpen = true
    },

    close() {
      this.isOpen = false
      this.component = null
      this.props = {}
      this.title = ''
    },
  },
})
