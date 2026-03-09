export default () => async (ctx, next) => {
  ctx.throwError = (error) => {
    if (error.name === 'MongoNetworkError') ctx.throw(599, 'Database connection error')
    if (error.name === 'CastError' || error.name === 'NotFoundError') ctx.throw(404, 'Resource not found')
    if (error.code === 11000) ctx.throw(409, 'Duplicate entry')
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message)
      ctx.throw(400, messages.join(', '))
    }
    ctx.throw(error.status || 500, error.message || 'Internal server error')
  }

  try {
    await next()
  }
  catch (error) {
    ctx.status = error.status || error.statusCode || 500
    ctx.body = {
      error: error.message || 'Internal server error',
      status: ctx.status,
    }

    if (ctx.status >= 500) {
      console.error('Server error:', error)
    }
  }
}
