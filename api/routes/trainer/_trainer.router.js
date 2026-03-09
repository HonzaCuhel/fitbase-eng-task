import KoaRouter from '@koa/router'
import Controller from './_trainer.controller.js'

export const secretRoutes = new KoaRouter({ prefix: '/trainers' })
  .get('/', Controller.getTrainers)
  .get('/:_id', Controller.getTrainer)
  .post('/', Controller.createTrainer)
  .put('/:_id', Controller.updateTrainer)
  .delete('/:_id', Controller.deleteTrainer)
