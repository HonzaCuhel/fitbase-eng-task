export default () => async (ctx, next) => {
  const host = ctx.request.headers.host || 'localhost'

  let workspace = 'default'

  if (host.includes('.')) {
    const parts = host.split('.')
    if (parts.length >= 2 && parts[0] !== 'www') {
      workspace = parts[0]
    }
  }

  if (ctx.query.workspace) {
    workspace = ctx.query.workspace
  }

  ctx.state.workspace = workspace
  ctx.state.appDomain = host

  await next()
}
