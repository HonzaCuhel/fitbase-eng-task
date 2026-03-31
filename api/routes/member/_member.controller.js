import { updateEnrollmentCount } from '../class/_class.functions.js'

// Promotes the oldest waitlisted member to confirmed for a class.
// Call this BEFORE updateEnrollmentCount so the promotion is reflected in the final counts.
const promoteFirstWaitlisted = async (ctx, classId) => {
  await ctx.Member.findOneAndUpdate(
    { class: classId, 'status.confirmation': 2 },
    { 'status.confirmation': 1 },
    { sort: { enrolledAt: 1 } },
  )
}

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
    if (ctx.query.status !== undefined) find['status.confirmation'] = parseInt(ctx.query.status)

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

    // Stats always count from the full class, not the filtered view
    const classFind = ctx.params._id ? { class: ctx.params._id } : null
    const stats = classFind ? {
      total: await ctx.Member.countDocuments(classFind),
      confirmed: await ctx.Member.countDocuments({ ...classFind, 'status.confirmation': 1 }),
      pending: await ctx.Member.countDocuments({ ...classFind, 'status.confirmation': 0 }),
      declined: await ctx.Member.countDocuments({ ...classFind, 'status.confirmation': -1 }),
      waitlisted: await ctx.Member.countDocuments({ ...classFind, 'status.confirmation': 2 }),
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
      const classDoc = await ctx.Class.findById(ctx.params._id)
      const body = { ...ctx.request.body }

      // If the class is full, force status to waitlisted (2) for pending/unset/confirmed enrollments
      if (classDoc && classDoc.enrollmentCount >= classDoc.general.capacity) {
        const incomingStatus = body.status?.confirmation
        if (incomingStatus === undefined || incomingStatus === 0 || incomingStatus === 1) {
          body.status = { ...body.status, confirmation: 2 }
        }
      }

      const member = await ctx.Member.create({ class: ctx.params._id, ...body })
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

    const classDoc = await ctx.Class.findById(ctx.params._id)
    const isFull = classDoc && classDoc.enrollmentCount >= classDoc.general.capacity

    const results = []
    const errors = []

    for (const memberData of members) {
      try {
        const member = await ctx.Member.create({
          class: ctx.params._id,
          properties: memberData,
          status: { confirmation: isFull ? 2 : 0, addMethod: 'batchImport' },
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
      const before = await ctx.Member.findById(ctx.params.memberId)
      if (!before) ctx.throw(404, 'Member not found')

      const newConfirmation = ctx.request.body.status?.confirmation

      // Capacity guard: block admin from confirming a member into a full class
      if (newConfirmation === 1 && before.status.confirmation !== 1) {
        const classDoc = await ctx.Class.findById(before.class)
        if (classDoc && classDoc.enrollmentCount >= classDoc.general.capacity) {
          ctx.throw(400, 'Class is full')
        }
      }

      const member = await ctx.Member.findByIdAndUpdate(
        ctx.params.memberId,
        ctx.request.body,
        { new: true, runValidators: true },
      )

      if (newConfirmation !== undefined) {
        // When a confirmed member declines, promote the first waitlisted member
        if (before.status.confirmation === 1 && newConfirmation === -1) {
          await promoteFirstWaitlisted(ctx, member.class)
        }
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

    // When a confirmed member is removed, promote the first waitlisted member
    if (member.status.confirmation === 1) {
      await promoteFirstWaitlisted(ctx, member.class)
    }

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
