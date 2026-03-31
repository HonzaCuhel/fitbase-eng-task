import KoaRouter from '@koa/router'
import Controller from './_ai.controller.js'

export const secretRoutes = new KoaRouter({ prefix: '/ai' })
  .post('/generate-description', Controller.generateDescription)
  .post('/enrollment-insights', Controller.enrollmentInsights)
