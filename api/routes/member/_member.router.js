import KoaRouter from '@koa/router'
import Controller from './_member.controller.js'

export const publicRoutes = new KoaRouter({ prefix: '/public/classes' })
  .post('/:_id/enroll', Controller.addMember)

const membersRoutes = new KoaRouter({ prefix: '/classes' })
  .get('/:_id/members', Controller.getMembers)
  .get('/:_id/members/export', Controller.exportMembers)
  .get('/:_id/members/:memberId', Controller.getMember)
  .post('/:_id/members', Controller.addMember)
  .post('/:_id/members/batch', Controller.addMembersMany)
  .put('/:_id/members/:memberId', Controller.updateMember)
  .delete('/:_id/members/:memberId', Controller.deleteMember)

const allMembersRoutes = new KoaRouter({ prefix: '/members' })
  .get('/', Controller.getAllMembers)

export const secretRoutes = new KoaRouter()
  .use(membersRoutes.routes(), membersRoutes.allowedMethods())
  .use(allMembersRoutes.routes(), allMembersRoutes.allowedMethods())
