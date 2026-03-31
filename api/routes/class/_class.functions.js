export const updateEnrollmentCount = async (ctx, classId) => {
  const enrollmentCount = await ctx.Member.countDocuments({
    class: classId,
    'status.confirmation': 1,
  })
  const waitlistCount = await ctx.Member.countDocuments({
    class: classId,
    'status.confirmation': 2,
  })
  await ctx.Class.findByIdAndUpdate(classId, { enrollmentCount, waitlistCount })
  return { enrollmentCount, waitlistCount }
}

export const formatClassForResponse = (classDoc) => {
  const obj = classDoc.toObject ? classDoc.toObject() : classDoc
  return {
    ...obj,
    isFull: obj.enrollmentCount >= (obj.general?.capacity || Infinity),
    spotsLeft: Math.max(0, (obj.general?.capacity || 0) - (obj.enrollmentCount || 0)),
    waitlistCount: obj.waitlistCount || 0,
  }
}
