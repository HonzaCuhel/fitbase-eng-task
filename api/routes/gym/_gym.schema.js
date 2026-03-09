import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 255 },
  domain: { type: String, unique: true, lowercase: true, trim: true },
  branding: {
    logo: String,
    primaryColor: { type: String, default: '#4f46e5' },
    font: { type: String, default: 'Inter' },
  },
  settings: {
    timezone: { type: String, default: 'America/New_York' },
    defaultLocale: { type: String, enum: ['en', 'cs', 'es'], default: 'en' },
    currency: { type: String, default: 'USD' },
  },
  contact: {
    email: String,
    phone: String,
    address: String,
    website: String,
  },
}, {
  timestamps: true,
})

export default schema
