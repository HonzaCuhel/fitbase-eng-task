import mongoose from 'mongoose'
import config from '../_config.js'

let connection = null

async function getConnection() {
  if (!connection || connection.readyState !== 1) {
    connection = await mongoose.createConnection(config.MONGO_DB_URI).asPromise()
    console.log('MongoDB connected')
  }
  return connection
}

export default async function getDatabase(ctx) {
  const conn = await getConnection()
  return conn.useDb(ctx.state.workspace, { useCache: true })
}
