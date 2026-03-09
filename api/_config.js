import dotenv from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env') })

export default {
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_PORT: process.env.API_PORT || 5051,
  MONGO_DB_URI: process.env.MONGO_DB_URI || 'mongodb://localhost:27017/',
  JWT_SECRET: process.env.JWT_SECRET || 'F1TB4S3_S3CR3T',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'F1TB4S3_R3FR3SH',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
}
