import { updateEnrollmentCount } from '../class/_class.functions.js'

class Controller {
  async getMembers(ctx) {
    const find = {}
    if (ctx.params._id) find.class = ctx.params._id
    if (ctx.query.search) {
      find.$or = [
        { 'properties.firstName': { $regex: ctx.query.search, $options: 'i' } },
        { 'properties.lastName': { $regex: ctx.query.search, $options: 'i' } },
        { 'properties.email': { $regex: ctx.query.search, $options: 'i' } },
      ]
    }
    if (ctx.query.status) find['status.confirmation'] = parseInt(ctx.query.status)

    const page = parseInt(ctx.query.page) || 1
    const limit = parseInt(ctx.query.limit) || 50
    const skip = (page - 1) * limit
    const sortField = ctx.query.sortField || 'createdAt'
    const sortDirection = ctx.query.sortDirection === 'asc' ? 1 : -1

    const results = await ctx.Member.find(find)
      .sort({ [sortField]: sortDirection })
      .skip(skip)
      .limit(limit)

    const total = await ctx.Member.countDocuments(find)

    const stats = ctx.params._id ? {
      total,
      confirmed: await ctx.Member.countDocuments({ ...find, 'status.confirmation': 1 }),
      pending: await ctx.Member.countDocuments({ ...find, 'status.confirmation': 0 }),
      declined: await ctx.Member.countDocuments({ ...find, 'status.confirmation': -1 }),
    } : { total }

    ctx.body = { results, total, stats, page, limit }
  }

  async getMember(ctx) {
    const member = await ctx.Member.findById(ctx.params.memberId)
    if (!member) ctx.throw(404, 'Member not found')
    ctx.body = member
  }

  async addMember(ctx) {
    try {
      const member = await ctx.Member.create({
        class: ctx.params._id,
        ...ctx.request.body,
      })
      await updateEnrollmentCount(ctx, ctx.params._id)
      ctx.body = member
      ctx.status = 201
    }
    catch (error) {
      ctx.throwError(error)
    }
  }

  async addMembersMany(ctx) {
    const { members } = ctx.request.body
    if (!Array.isArray(members)) ctx.throw(400, 'Members must be an array')

    const results = []
    const errors = []

    for (const memberData of members) {
      try {
        const member = await ctx.Member.create({
          class: ctx.params._id,
          properties: memberData,
          status: { confirmation: 0, addMethod: 'batchImport' },
        })
        results.push(member)
      }
      catch (error) {
        errors.push({ data: memberData, error: error.message })
      }
    }

    await updateEnrollmentCount(ctx, ctx.params._id)
    ctx.body = { results, errors, total: results.length }
  }

  async updateMember(ctx) {
    try {
      const member = await ctx.Member.findByIdAndUpdate(
        ctx.params.memberId,
        ctx.request.body,
        { new: true, runValidators: true },
      )
      if (!member) ctx.throw(404, 'Member not found')

      if (ctx.request.body.status?.confirmation !== undefined) {
        await updateEnrollmentCount(ctx, member.class)
      }

      ctx.body = member
    }
    catch (error) {
      ctx.throwError(error)
    }
  }

  async deleteMember(ctx) {
    const member = await ctx.Member.findByIdAndDelete(ctx.params.memberId)
    if (!member) ctx.throw(404, 'Member not found')
    await updateEnrollmentCount(ctx, member.class)
    ctx.body = { success: true }
  }

  async exportMembers(ctx) {
    const find = {}
    if (ctx.params._id) find.class = ctx.params._id

    const results = await ctx.Member.find(find).sort({ 'properties.lastName': 1 })
    ctx.body = { results }
  }

  async getAllMembers(ctx) {
    const find = {}
    if (ctx.query.search) {
      find.$or = [
        { 'properties.firstName': { $regex: ctx.query.search, $options: 'i' } },
        { 'properties.lastName': { $regex: ctx.query.search, $options: 'i' } },
        { 'properties.email': { $regex: ctx.query.search, $options: 'i' } },
      ]
    }

    const page = parseInt(ctx.query.page) || 1
    const limit = parseInt(ctx.query.limit) || 50
    const skip = (page - 1) * limit

    const results = await ctx.Member.find(find)
      .populate('class', 'general.title')
      .sort({ 'properties.lastName': 1 })
      .skip(skip)
      .limit(limit)

    const total = await ctx.Member.countDocuments(find)
    ctx.body = { results, total, page, limit }
  }
}

export default new Controller()
