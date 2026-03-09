import KoaRouter from '@koa/router'
import Controller from './_class.controller.js'

export const publicRoutes = new KoaRouter({ prefix: '/public/classes' })
  .get('/', Controller.getPublic)
  .get('/:_id', Controller.getClass)

export const secretRoutes = new KoaRouter({ prefix: '/classes' })
  .get('/', Controller.getClasses)
  .get('/:_id', Controller.getClass)
  .post('/', Controller.createClass)
  .put('/:_id', Controller.updateClass)
  .delete('/:_id', Controller.deleteClass)
  .put('/:_id/schedule/:sessionIndex', Controller.updateSchedule)
  .post('/:_id/schedule', Controller.addScheduleSession)
  .delete('/:_id/schedule/:sessionIndex', Controller.removeScheduleSession)
