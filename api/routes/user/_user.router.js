import KoaRouter from '@koa/router'
import Controller from './_user.controller.js'

export const publicRoutes = new KoaRouter({ prefix: '/public/users' })
  .post('/login', Controller.login)
  .post('/register', Controller.register)
  .post('/forgotten-password', Controller.forgottenPassword)
  .post('/refresh-token', Controller.refreshToken)

export const secretRoutes = new KoaRouter({ prefix: '/users' })
  .get('/', Controller.getUsers)
  .get('/me', Controller.me)
  .put('/me', Controller.updateMe)
  .post('/logout', Controller.logout)
