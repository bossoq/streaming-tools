import dotenvFlow from 'dotenv-flow'
dotenvFlow.config()

import { createClient } from 'redis'
import { DiscordClient } from './discord/discord'
import { Player } from './discord/lib/Player'
import { twitchClient } from './twitch/twitch'
import { eventsubClient } from './backend/twitchpubsub'
import { app } from './backend/express'
import { pubSubCron, requestPubSub } from './backend/youtubehook'
import { ablyMessage } from './discord/ably'
import { pubMessage } from './backend/AblySub'
import { apiClient } from './backend/twitchapiclient'
import { sendLiveNotify, sendOfflineNotify } from './twitch/actions'
import { AutoMessage } from './twitch/automessage'
import { initializeStat } from './twitch/initialize'

const userId = process.env.TWITCH_USERID || '218581653'
const port = process.env.PORT || 3000
const redisURL = process.env.REDIS_URL || 'redis://localhost:6379'
const env = process.env.NODE_ENV || 'development'

const redisClient = createClient({ url: redisURL })
redisClient.connect().catch(console.error)
redisClient.hSet('twitchBotStat', 'env', env)

export const discordClient = new DiscordClient()
export const player = new Player()
export const twitchChatClient = twitchClient(redisClient, pubMessage)
export const twitchApiClient = apiClient()
export const autoMessage = new AutoMessage(twitchChatClient, redisClient)
const eventsubMiddleWare = eventsubClient(app)
eventsubMiddleWare.then((middleWare) => {
  app.listen(port, async () => {
    console.log(`Successfully start Express Server on ${port}`)
    await middleWare.markAsReady()

    await middleWare.subscribeToStreamOnlineEvents(userId, async (e) => {
      console.log(`${e.broadcasterDisplayName} just went live!`)
      await sendLiveNotify(await twitchChatClient, e, {
        redis: redisClient,
        pubMessage
      })
    })
    await middleWare.subscribeToStreamOfflineEvents(userId, async (e) => {
      console.log(`${e.broadcasterDisplayName} just went offline`)
      await sendOfflineNotify(await twitchChatClient, e, {
        redis: redisClient,
        pubMessage
      })
    })
    console.log(`Successfully create Twitch PubSub Client for ${userId}`)
    await requestPubSub()
    pubSubCron.start()
    console.log('Start Youtube PubSub Client & Cron')
    ablyMessage()
    console.log('Successfully sub to Ably')
    await autoMessage.initClient()
    await initializeStat(redisClient)
  })
})

const cleanExit = () => {
  redisClient.disconnect()
  process.exit()
}

process.on('exit', () => cleanExit())
process.on('SIGINT', () => cleanExit())
process.on('SIGTERM', () => cleanExit())
process.on('uncaughtException', () => cleanExit())
