import Koa from 'koa'
import KoaBodyParser from 'koa-bodyparser'
import KoaLogger from 'koa-logger'
import KoaHelmet from 'koa-helmet'
import KoaCors from '@koa/cors'
import KoaJwt from 'koa-jwt'

import config from './_config.js'
import ErrorHandler from './middlewares/_error-handler.js'
import workspace from './middlewares/_workspace.js'
import models from './middlewares/_models.js'
import user from './middlewares/_user.js'
import router from './_router.js'

const app = new Koa()

app.use(ErrorHandler(app))
app.use(KoaBodyParser())
app.use(KoaLogger())
app.use(KoaHelmet())
app.use(KoaCors())

app.use(KoaJwt({ secret: config.JWT_SECRET, key: 'jwt' }).unless({
  path: [/^\/api\/public/],
}))

app.use(workspace())
app.use(models())
app.use(user())
app.use(router())

if (process.env.NODE_ENV !== 'production') {
  app.listen(config.API_PORT, () => console.log(`API: http://localhost:${config.API_PORT}`))
    .on('error', (error) => console.error(error))

  process.on('SIGINT', () => process.exit(1))
  process.on('SIGTERM', () => process.exit(1))
}

export default app.callback()
