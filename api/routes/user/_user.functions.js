import jwt from 'jsonwebtoken'
import config from '../../_config.js'

const JWT_TOKEN_EXPIRATION = '15m'
const JWT_REFRESH_EXPIRATION = '7d'

export const generateAuthTokens = async (user, ctx) => {
  const refreshToken = jwt.sign({ data: { _id: user._id } }, config.JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRATION })
  const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET)

  await ctx.User.updateOne(
    { _id: user._id },
    { $push: { 'authTokens.refreshTokens': { token: refreshToken, expiringAt: new Date(decoded.exp * 1000) } } },
  )

  await ctx.User.updateOne(
    { _id: user._id },
    { $pull: { 'authTokens.refreshTokens': { expiringAt: { $lt: new Date() } } } },
  )

  const accessToken = jwt.sign({ data: { _id: user._id, email: user.email, role: user.role } }, config.JWT_SECRET, { expiresIn: JWT_TOKEN_EXPIRATION })

  return { accessToken, refreshToken }
}

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.JWT_REFRESH_SECRET)
}
