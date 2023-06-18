// import { AppTokenAuthProvider } from '@twurple/auth'
import { StaticAuthProvider } from '@twurple/auth'
import { ApiClient } from '@twurple/api'

// const httpClientId = process.env.TWITCH_HTTP_CLIENT_ID || ''
// const httpClientSecret = process.env.TWITCH_HTTP_CLIENT_SECRET || ''
const clientId = process.env.TWITCH_HTTP_CLIENT_ID || ''
const accessToken = process.env.TWITCH_HTTP_ACCESS_TOKEN || ''

export const apiClient = () => {
  // const authProvider = new AppTokenAuthProvider(httpClientId, httpClientSecret)
  const authProvider = new StaticAuthProvider(clientId, accessToken)
  const apiClient = new ApiClient({ authProvider })
  return apiClient
}
