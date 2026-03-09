export default () => async (ctx, next) => {
  ctx.state.ipAddress = ctx.request.headers['x-real-ip'] || ctx.request.ip
  ctx.state.userAgent = ctx.request.headers['user-agent']

  if (ctx.state.jwt?.data?._id) {
    const user = await ctx.User.findById(ctx.state.jwt.data._id)

    if (user?.role === 'blocked') ctx.throw(403, 'Your account is blocked.')

    ctx.state.user = {
      data: user,
      hasRole: (role) => Array.isArray(role) ? role.includes(user.role) : user.role === role,
    }
  }

  await next()
}
