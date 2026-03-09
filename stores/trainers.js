export const useTrainersStore = defineStore('trainers', {
  state: () => ({
    trainers: [],
    total: 0,
    isLoading: false,
  }),

  actions: {
    async fetchTrainers() {
      this.isLoading = true
      try {
        const data = await useApi().get('/trainers')
        this.trainers = data.results
        this.total = data.total
        return data
      }
      catch (error) {
        const { $i18n } = useNuxtApp()
        useToast().error($i18n.t('errors.loadTrainers'))
        throw error
      }
      finally {
        this.isLoading = false
      }
    },

    async addTrainer(trainerData) {
      const data = await useApi().post('/trainers', trainerData)
      this.trainers.push(data)
      this.total++
      const { $i18n } = useNuxtApp()
      useToast().success($i18n.t('trainer.created'))
      return data
    },

    async updateTrainer(trainerId, data) {
      const result = await useApi().put(`/trainers/${trainerId}`, data)
      const index = this.trainers.findIndex((t) => t._id === trainerId)
      if (index !== -1) this.trainers.splice(index, 1, result)
      const { $i18n } = useNuxtApp()
      useToast().success($i18n.t('trainer.updated'))
      return result
    },

    async deleteTrainer(trainerId) {
      await useApi().delete(`/trainers/${trainerId}`)
      this.trainers = this.trainers.filter((t) => t._id !== trainerId)
      this.total--
      const { $i18n } = useNuxtApp()
      useToast().success($i18n.t('trainer.deleted'))
    },
  },
})
