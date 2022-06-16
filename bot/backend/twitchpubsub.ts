import { ClientCredentialsAuthProvider } from '@twurple/auth'
import { ApiClient } from '@twurple/api'
import { EventSubMiddleware } from '@twurple/eventsub'
import type { Express } from 'express'

const httpClientId = process.env.TWITCH_HTTP_CLIENT_ID || ''
const httpClientSecret = process.env.TWITCH_HTTP_CLIENT_SECRET || ''
const secret = process.env.EVENT_SUB_SECRET || ''

export const eventsubClient = async (app: Express) => {
  const authProvider = new ClientCredentialsAuthProvider(
    httpClientId,
    httpClientSecret
  )
  const apiClient = new ApiClient({ authProvider })
  const middleWare = new EventSubMiddleware({
    apiClient,
    hostName: 'botcallback.picturo.us',
    pathPrefix: '/twitch',
    secret
  })
  await middleWare.apply(app)
  return middleWare
}
