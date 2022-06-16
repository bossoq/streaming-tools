import dotenvFlow from 'dotenv-flow'
dotenvFlow.config()

import { DiscordClient } from './discord/discord'
import { Player } from './discord/lib/Player'
import { twitchClient } from './twitch/twitch'
import { eventsubClient } from './backend/twitchpubsub'
import { app } from './backend/express'
import { pubSubCron, requestPubSub } from './backend/youtubehook'
import { ablyMessage } from './discord/ably'
import { botState } from './backend/state'
import { syncStateFile } from './backend/state'
import { apiClient } from './backend/twitchapiclient'

const userId = process.env.TWITCH_USERID || '218581653'
const port = process.env.PORT || 3000

export const discordClient = new DiscordClient()
export const player = new Player()
export const twitchChatClient = twitchClient()
export const twitchApiClient = apiClient()
const eventsubMiddleWare = eventsubClient(app)
eventsubMiddleWare.then((middleWare) => {
  app.listen(port, async () => {
    console.log(`Successfully start Express Server on ${port}`)
    await middleWare.markAsReady()

    await middleWare.subscribeToStreamOnlineEvents(userId, (e) => {
      console.log(`${e.broadcasterDisplayName} just went live!`)
    })
    await middleWare.subscribeToStreamOfflineEvents(userId, (e) => {
      console.log(`${e.broadcasterDisplayName} just went offline`)
    })
    console.log(`Successfully create Twitch PubSub Client for ${userId}`)
    await requestPubSub()
    pubSubCron.start()
    console.log('Start Youtube PubSub Client & Cron')
    ablyMessage()
    console.log('Successfully sub to Ably')
    syncStateFile.start()
    console.log('Start state file sync cron')
  })
})

const cleanExit = () => {
  botState.writeStateFile()
  process.exit()
}

process.on('exit', () => cleanExit())
process.on('SIGINT', () => cleanExit())
process.on('SIGTERM', () => cleanExit())
process.on('uncaughtException', () => cleanExit())
