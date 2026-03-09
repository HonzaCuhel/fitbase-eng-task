class Controller {
  async getTrainers(ctx) {
    const find = {}
    if (ctx.query.search) {
      find.fullName = { $regex: ctx.query.search, $options: 'i' }
    }

    const results = await ctx.Trainer.find(find).sort({ fullName: 1 })
    const total = await ctx.Trainer.countDocuments(find)

    ctx.body = { results, total }
  }

  async getTrainer(ctx) {
    const trainer = await ctx.Trainer.findById(ctx.params._id)
    if (!trainer) ctx.throw(404, 'Trainer not found')
    ctx.body = trainer
  }

  async createTrainer(ctx) {
    try {
      const trainer = await ctx.Trainer.create(ctx.request.body)
      ctx.body = trainer
      ctx.status = 201
    }
    catch (error) {
      ctx.throwError(error)
    }
  }

  async updateTrainer(ctx) {
    try {
      const trainer = await ctx.Trainer.findByIdAndUpdate(
        ctx.params._id,
        ctx.request.body,
        { new: true, runValidators: true },
      )
      if (!trainer) ctx.throw(404, 'Trainer not found')
      ctx.body = trainer
    }
    catch (error) {
      ctx.throwError(error)
    }
  }

  async deleteTrainer(ctx) {
    const trainer = await ctx.Trainer.findByIdAndDelete(ctx.params._id)
    if (!trainer) ctx.throw(404, 'Trainer not found')
    ctx.body = { success: true }
  }
}

export default new Controller()
