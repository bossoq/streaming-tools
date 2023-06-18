import dotenv from 'dotenv'
dotenv.config({
  path: process.env.NODE_ENV === 'production' ? undefined : '../.env.local'
})

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
import { logger } from './logger'
import { maintainDatabase } from './backend/twitchidmap'

const userId = process.env.TWITCH_USERID || '218581653'
const port = process.env.PORT || 3000
const redisURL = process.env.REDIS_URL || 'redis://localhost:6379'
const env = process.env.NODE_ENV || 'development'

const redisClient = createClient({ url: redisURL })
redisClient.connect().catch(logger.error)
redisClient.hSet('twitchBotStat', 'env', env)

export const discordClient = new DiscordClient()
export const player = new Player()
export const twitchChatClient = twitchClient(redisClient, pubMessage)
export const twitchApiClient = apiClient()
export const autoMessage = new AutoMessage(twitchChatClient, redisClient)
const eventsubMiddleWare = eventsubClient(app)
eventsubMiddleWare.then((middleWare) => {
  app.listen(port, async () => {
    logger.info(`[EXPRESS] Successfully start Express Server on ${port}`)
    await middleWare.markAsReady()

    middleWare.onStreamOnline(userId, async (e) => {
      logger.info(`[TWITCH] #${e.broadcasterDisplayName} just went live`)
      await sendLiveNotify(await twitchChatClient, e, {
        redis: redisClient,
        pubMessage
      })
    })
    middleWare.onStreamOffline(userId, async (e) => {
      logger.info(`[TWITCH] #${e.broadcasterDisplayName} just went offline`)
      await sendOfflineNotify(await twitchChatClient, e, {
        redis: redisClient,
        pubMessage
      })
    })
    logger.info(
      `[TWITCH] Successfully create Twitch PubSub client for ${userId}`
    )
    await requestPubSub()
    pubSubCron.start()
    logger.info(`[YOUTUBE] Successfully create Youtube PubSub client & cron`)
    ablyMessage()
    logger.info('[ABLY] Successfully create Ably PubSub client')
    await autoMessage.initClient()
    await initializeStat(redisClient)
    await maintainDatabase()
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
