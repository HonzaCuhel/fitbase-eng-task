import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  properties: {
    firstName: { type: String, required: true, trim: true, maxlength: 255 },
    lastName: { type: String, required: true, trim: true, maxlength: 255 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 320 },
    phone: { type: String, maxlength: 50 },
  },
  status: {
    confirmation: { type: Number, default: 0 }, // -1=declined, 0=pending, 1=confirmed, 2=waitlisted
    addMethod: { type: String, enum: ['singleAdd', 'batchImport', 'publicRegistration'], default: 'singleAdd' },
  },
  enrolledAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
})

schema.index({ class: 1 })
schema.index({ 'properties.email': 1, class: 1 }, { unique: true })
schema.index({ class: 1, 'status.confirmation': 1, enrolledAt: 1 })

export default schema
