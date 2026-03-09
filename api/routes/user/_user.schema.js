import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const schema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true, maxlength: 255 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 320 },
  password: { type: String, select: false, minlength: 8 },
  role: { type: String, enum: ['admin', 'creator', 'editor', 'blocked'], default: 'editor' },
  locale: { type: String, enum: ['en', 'cs', 'es'], default: 'en' },
  status: { type: String, enum: ['pendingInvite', 'active'], default: 'pendingInvite' },
  profilePhoto: String,
  authTokens: {
    refreshTokens: [{
      token: String,
      expiringAt: Date,
    }],
  },
}, {
  timestamps: true,
})

schema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

schema.methods.isValidPassword = async function (password) {
  return bcrypt.compare(password, this.password)
}

export default schema
