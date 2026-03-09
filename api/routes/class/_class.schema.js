import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  general: {
    title: { type: String, required: true, trim: true, maxlength: 1000 },
    description: { type: String, maxlength: 5000 },
    startDate: Date,
    endDate: Date,
    location: { type: String, maxlength: 500 },
    capacity: { type: Number, default: 20 },
    trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer' },
    tags: [{ type: String, trim: true }],
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    type: { type: String, enum: ['yoga', 'hiit', 'pilates', 'strength', 'barre', 'meditation', 'crossfit', 'other'], default: 'other' },
  },
  schedule: [{
    dayOfWeek: { type: Number, min: 0, max: 6 },
    startTime: { type: String },
    endTime: { type: String },
    room: { type: String, maxlength: 255 },
  }],
  enrollmentCount: { type: Number, default: 0 },
}, {
  timestamps: true,
})

schema.index({ 'general.status': 1 })
schema.index({ 'general.trainer': 1 })

export default schema
