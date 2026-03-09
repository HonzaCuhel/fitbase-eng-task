import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true, maxlength: 255 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 320 },
  specialties: [{ type: String, trim: true }],
  profilePhoto: String,
  bio: { type: String, maxlength: 5000 },
}, {
  timestamps: true,
})

export default schema
