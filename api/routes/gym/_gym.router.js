import KoaRouter from '@koa/router'
import Controller from './_gym.controller.js'

export const secretRoutes = new KoaRouter({ prefix: '/gym' })
  .get('/', Controller.getGym)
  .put('/', Controller.updateGym)
