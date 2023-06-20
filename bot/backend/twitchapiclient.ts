// import { AppTokenAuthProvider } from '@twurple/auth'
// import { StaticAuthProvider } from '@twurple/auth'
import { ApiClient } from '@twurple/api'
import { RefreshingAuthProvider } from '@twurple/auth'
import { promises as fs } from 'node:fs'
import { readFileSync as fsRead } from 'node:fs'

// const httpClientId = process.env.TWITCH_HTTP_CLIENT_ID || ''
// const httpClientSecret = process.env.TWITCH_HTTP_CLIENT_SECRET || ''
const clientId = process.env.TWITCH_HTTP_CLIENT_ID || ''
const clientSecret = process.env.TWITCH_HTTP_CLIENT_SECRET || ''
const tokenData = JSON.parse(fsRead('../config.json', 'utf-8'))

export const apiClient = () => {
  // const authProvider = new AppTokenAuthProvider(httpClientId, httpClientSecret)
  // const authProvider = new StaticAuthProvider(clientId, accessToken)
  const authProvider = new RefreshingAuthProvider({
    clientId,
    clientSecret,
    onRefresh: async (_, newTokenData) =>
      await fs.writeFile(
        '../config.json',
        JSON.stringify(newTokenData, null, 2),
        'utf-8'
      )
  })
  authProvider.addUserForToken(tokenData)
  const apiClient = new ApiClient({ authProvider })
  return apiClient
}
