import { generateAuthTokens, verifyRefreshToken } from './_user.functions.js'

class Controller {
  async login(ctx) {
    const { email, password } = ctx.request.body

    if (!email || !password) ctx.throw(400, 'Email and password are required')

    const user = await ctx.User.findOne({ email }).select('+password')
    if (!user) ctx.throw(404, 'User not found')

    const isMatch = await user.isValidPassword(password)
    if (!isMatch) ctx.throw(403, 'Invalid password')

    const tokens = await generateAuthTokens(user, ctx)

    const userObj = user.toObject()
    delete userObj.password

    ctx.body = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: userObj,
    }
  }

  async register(ctx) {
    const { fullName, email, password, gymName } = ctx.request.body

    if (!fullName || !email || !password) ctx.throw(400, 'Full name, email, and password are required')

    try {
      const user = await ctx.User.create({
        fullName,
        email,
        password,
        role: 'admin',
        status: 'active',
      })

      if (gymName) {
        await ctx.Gym.create({ name: gymName, domain: ctx.state.workspace })
      }

      const tokens = await generateAuthTokens(user, ctx)

      const userObj = user.toObject()
      delete userObj.password

      ctx.body = {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: userObj,
      }
    }
    catch (error) {
      ctx.throwError(error)
    }
  }

  async me(ctx) {
    if (!ctx.state.user?.data) ctx.throw(401, 'Not authenticated')
    ctx.body = ctx.state.user.data
  }

  async updateMe(ctx) {
    try {
      const data = {}
      const allowed = ['fullName', 'profilePhoto', 'locale']
      for (const key of allowed) {
        if (ctx.request.body[key] !== undefined) data[key] = ctx.request.body[key]
      }

      const record = await ctx.User.findByIdAndUpdate(
        ctx.state.user.data._id,
        data,
        { new: true, runValidators: true },
      )
      ctx.body = record
    }
    catch (error) {
      ctx.throwError(error)
    }
  }

  async logout(ctx) {
    const refreshToken = ctx.request.body.refreshToken
    if (refreshToken) {
      await ctx.User.updateOne(
        { _id: ctx.state.user.data._id },
        { $pull: { 'authTokens.refreshTokens': { token: refreshToken } } },
      )
    }
    ctx.body = { success: true }
  }

  async refreshToken(ctx) {
    const { refreshToken } = ctx.request.body
    if (!refreshToken) ctx.throw(400, 'Refresh token is required')

    try {
      const decoded = verifyRefreshToken(refreshToken)
      const user = await ctx.User.findById(decoded.data._id)
      if (!user) ctx.throw(404, 'User not found')

      const tokenExists = user.authTokens?.refreshTokens?.some((t) => t.token === refreshToken)
      if (!tokenExists) ctx.throw(403, 'Invalid refresh token')

      await ctx.User.updateOne(
        { _id: user._id },
        { $pull: { 'authTokens.refreshTokens': { token: refreshToken } } },
      )

      const tokens = await generateAuthTokens(user, ctx)
      ctx.body = {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      }
    }
    catch (error) {
      ctx.throw(403, 'Invalid refresh token')
    }
  }

  async getUsers(ctx) {
    const find = {}
    if (ctx.query.role) find.role = ctx.query.role

    const sortField = ctx.query.sortField || 'fullName'
    const sortDirection = ctx.query.sortDirection || 'asc'

    const results = await ctx.User.find(find).sort({ [sortField]: sortDirection })
    const total = await ctx.User.countDocuments(find)

    ctx.body = { results, total }
  }

  async forgottenPassword(ctx) {
    const { email } = ctx.request.body
    if (!email) ctx.throw(400, 'Email is required')

    const user = await ctx.User.findOne({ email })
    if (!user) ctx.throw(404, 'User not found')

    // In production, send a reset email here
    ctx.body = { success: true }
  }
}

export default new Controller()
