import KoaRouter from '@koa/router'
import * as userRoutes from './routes/user/_user.router.js'
import * as classRoutes from './routes/class/_class.router.js'
import * as memberRoutes from './routes/member/_member.router.js'
import * as trainerRoutes from './routes/trainer/_trainer.router.js'
import * as gymRoutes from './routes/gym/_gym.router.js'
import * as aiRoutes from './routes/ai/_ai.router.js'

const allRoutes = [userRoutes, classRoutes, memberRoutes, trainerRoutes, gymRoutes, aiRoutes]

export default () => {
  const router = new KoaRouter({ prefix: '/api' })

  for (const route of allRoutes) {
    if (route.publicRoutes) router.use(route.publicRoutes.routes(), route.publicRoutes.allowedMethods())
    if (route.secretRoutes) router.use(route.secretRoutes.routes(), route.secretRoutes.allowedMethods())
  }

  return router.routes()
}
