import { ClientCredentialsAuthProvider } from '@twurple/auth'
import { ApiClient } from '@twurple/api'

const httpClientId = process.env.TWITCH_HTTP_CLIENT_ID || ''
const httpClientSecret = process.env.TWITCH_HTTP_CLIENT_SECRET || ''

export const apiClient = () => {
  const authProvider = new ClientCredentialsAuthProvider(
    httpClientId,
    httpClientSecret
  )
  const apiClient = new ApiClient({ authProvider })
  return apiClient
}
