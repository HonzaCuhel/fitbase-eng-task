export const updateEnrollmentCount = async (ctx, classId) => {
  const count = await ctx.Member.countDocuments({
    class: classId,
    'status.confirmation': 1,
  })
  await ctx.Class.findByIdAndUpdate(classId, { enrollmentCount: count })
  return count
}

export const formatClassForResponse = (classDoc) => {
  const obj = classDoc.toObject ? classDoc.toObject() : classDoc
  return {
    ...obj,
    isFull: obj.enrollmentCount >= (obj.general?.capacity || Infinity),
    spotsLeft: Math.max(0, (obj.general?.capacity || 0) - (obj.enrollmentCount || 0)),
  }
}
