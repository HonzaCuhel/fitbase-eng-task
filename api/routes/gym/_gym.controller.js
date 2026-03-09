class Controller {
  async getGym(ctx) {
    const gym = await ctx.Gym.findOne()
    if (!gym) ctx.throw(404, 'Gym not found')
    ctx.body = gym
  }

  async updateGym(ctx) {
    try {
      let gym = await ctx.Gym.findOne()
      if (!gym) {
        gym = await ctx.Gym.create(ctx.request.body)
      }
      else {
        Object.assign(gym, ctx.request.body)
        await gym.save()
      }
      ctx.body = gym
    }
    catch (error) {
      ctx.throwError(error)
    }
  }
}

export default new Controller()
