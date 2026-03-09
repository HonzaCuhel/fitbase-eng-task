import { updateEnrollmentCount, formatClassForResponse } from './_class.functions.js'

class Controller {
  async getClasses(ctx) {
    const find = {}
    if (ctx.query.status) find['general.status'] = ctx.query.status
    if (ctx.query.trainer) find['general.trainer'] = ctx.query.trainer
    if (ctx.query.search) {
      find['general.title'] = { $regex: ctx.query.search, $options: 'i' }
    }

    const page = parseInt(ctx.query.page) || 1
    const limit = parseInt(ctx.query.limit) || 20
    const skip = (page - 1) * limit
    const sortField = ctx.query.sortField || 'createdAt'
    const sortDirection = ctx.query.sortDirection === 'asc' ? 1 : -1

    const results = await ctx.Class.find(find)
      .populate('general.trainer')
      .sort({ [sortField]: sortDirection })
      .skip(skip)
      .limit(limit)

    const total = await ctx.Class.countDocuments(find)

    ctx.body = {
      results: results.map(formatClassForResponse),
      total,
      page,
      limit,
    }
  }

  async getClass(ctx) {
    const classDoc = await ctx.Class.findById(ctx.params._id).populate('general.trainer')
    if (!classDoc) ctx.throw(404, 'Class not found')
    ctx.body = formatClassForResponse(classDoc)
  }

  async createClass(ctx) {
    try {
      const classDoc = await ctx.Class.create(ctx.request.body)
      ctx.body = formatClassForResponse(classDoc)
      ctx.status = 201
    }
    catch (error) {
      ctx.throwError(error)
    }
  }

  async updateClass(ctx) {
    try {
      const classDoc = await ctx.Class.findByIdAndUpdate(
        ctx.params._id,
        ctx.request.body,
        { new: true, runValidators: true },
      ).populate('general.trainer')

      if (!classDoc) ctx.throw(404, 'Class not found')
      ctx.body = formatClassForResponse(classDoc)
    }
    catch (error) {
      ctx.throwError(error)
    }
  }

  async deleteClass(ctx) {
    const classDoc = await ctx.Class.findByIdAndDelete(ctx.params._id)
    if (!classDoc) ctx.throw(404, 'Class not found')

    await ctx.Member.deleteMany({ class: ctx.params._id })
    ctx.body = { success: true }
  }

  async updateSchedule(ctx) {
    const classDoc = await ctx.Class.findById(ctx.params._id)
    if (!classDoc) ctx.throw(404, 'Class not found')

    const sessionIndex = parseInt(ctx.params.sessionIndex)
    if (sessionIndex < 0 || sessionIndex >= classDoc.schedule.length) {
      ctx.throw(400, 'Invalid session index')
    }

    classDoc.schedule[sessionIndex] = { ...classDoc.schedule[sessionIndex].toObject(), ...ctx.request.body }
    await classDoc.save()

    ctx.body = classDoc.schedule[sessionIndex]
  }

  async addScheduleSession(ctx) {
    const classDoc = await ctx.Class.findById(ctx.params._id)
    if (!classDoc) ctx.throw(404, 'Class not found')

    classDoc.schedule.push(ctx.request.body)
    await classDoc.save()

    ctx.body = classDoc.schedule[classDoc.schedule.length - 1]
    ctx.status = 201
  }

  async removeScheduleSession(ctx) {
    const classDoc = await ctx.Class.findById(ctx.params._id)
    if (!classDoc) ctx.throw(404, 'Class not found')

    const sessionIndex = parseInt(ctx.params.sessionIndex)
    classDoc.schedule.splice(sessionIndex, 1)
    await classDoc.save()

    ctx.body = { success: true }
  }

  async getPublic(ctx) {
    const find = { 'general.status': 'published' }
    if (ctx.query.type) find['general.type'] = ctx.query.type

    const results = await ctx.Class.find(find)
      .populate('general.trainer', 'fullName specialties profilePhoto')
      .sort({ 'general.title': 1 })

    ctx.body = { results: results.map(formatClassForResponse) }
  }
}

export default new Controller()
