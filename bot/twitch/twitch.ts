import fs from 'node:fs'
import { StaticAuthProvider } from '@twurple/auth'
import { ChatClient } from '@twurple/chat'
import { upsertUser } from '../backend/prismaUtils'
import {
  handleChannelPoints,
  onBits,
  onSubGift,
  onSub,
  onCommunitySub,
  onRaid
} from './actions'
import { checkCooldown } from './cooldown'
import type { createClient } from 'redis'
import type { TwitchCommand } from './types'

const clientId = process.env.TWITCH_CLIENT_ID || ''
const accessToken = process.env.TWITCH_ACCESS_TOKEN || ''
const botNick = process.env.TWITCH_BOT_NICK || ''
const channelName = process.env.TWITCH_CHANNEL_NAME || ''

export const twitchClient = async (
  redisClient: ReturnType<typeof createClient>,
  pubMessage: (channelName: string, name: string, data: string) => void
) => {
  const authProvider = new StaticAuthProvider(clientId, accessToken)
  const chatClient = new ChatClient({
    authProvider,
    channels: [channelName],
    requestMembershipEvents: true,
    webSocket: true
  })
  await chatClient.connect().catch(console.error)
  chatClient.onRegister(() => {
    console.log(`${botNick} connected to Twitch on channel ${channelName}`)
  })

  const commands = new Map<string, TwitchCommand>()

  const commandFiles = fs
    .readdirSync('./twitch/commands')
    .filter((file) => file.endsWith('.ts'))

  for (const file of commandFiles) {
    const command: TwitchCommand = require(`./commands/${file}`).default

    if (Array.isArray(command.name)) {
      for (const name of command.name) {
        commands.set(name, command)
      }
    } else {
      commands.set(command.name, command)
    }
  }

  const sendMessage = async (channel: string, message: string) => {
    const env =
      (await redisClient.hGet('twitchBotStat', 'env')) === 'production'
    if (env) {
      await chatClient.say(channel, message)
    } else {
      console.log(`[${channel}] ${message}`)
    }
  }
  const sendFeedMessage = async (channel: string, message: string) => {
    const env =
      (await redisClient.hGet('twitchBotStat', 'env')) === 'production'
    const webfeed =
      (await redisClient.hGet('twitchBotStat', 'feedEnable')) === 'on'
    if (env && !webfeed) {
      await chatClient.say(channel, message)
    } else {
      console.log(`[${channel}] ${message}`)
    }
  }
  const timeout = async (
    channel: string,
    userName: string,
    duration?: number,
    reason?: string
  ) => {
    const env =
      (await redisClient.hGet('twitchBotStat', 'env')) === 'production'
    if (env) {
      await chatClient.timeout(
        channel,
        userName,
        duration ?? 60,
        reason ?? 'โดนลงดาบนะจ๊ะ'
      )
    } else {
      console.log(
        `[${channel}] ${userName} timeout for ${
          duration ?? 60
        } seconds with reason: ${reason ?? 'โดนลงดาบนะจ๊ะ'}`
      )
    }
  }
  const ban = async (channel: string, userName: string, reason?: string) => {
    const env =
      (await redisClient.hGet('twitchBotStat', 'env')) === 'production'
    if (env) {
      await chatClient.ban(channel, userName, reason ?? 'โดนลงดาบนะจ๊ะ')
    } else {
      console.log(
        `[${channel}] ${userName} ban with reason: ${reason ?? 'โดนลงดาบนะจ๊ะ'}`
      )
    }
  }

  chatClient.onMessage(async (channel, user, message, tag) => {
    const subMonth = parseInt(tag.userInfo.badgeInfo.get('subscriber') || '0')
    await upsertUser(tag.userInfo.userName, tag.userInfo.userId, subMonth)
    console.log(`${channel} ${user}: ${message}`)
    if (tag.isCheer) {
      await onBits(channel, tag, subMonth, {
        redis: redisClient,
        sendMessage,
        pubMessage
      })
    }
    if (tag.isRedemption) {
      await handleChannelPoints(tag, subMonth)
    }
    if (user === botNick) return

    const commandStr = message
      .toLowerCase()
      .split(' ')[0]
      .replace(/(!\w+)(!\w+)*/, '$1')

    const command = commands.get(commandStr)

    if (!command) return
    const cooldown = await checkCooldown(commandStr, tag, {
      redis: redisClient
    })

    if (cooldown) {
      command.execute(chatClient, channel, user, message, tag, {
        redis: redisClient,
        sendMessage,
        sendFeedMessage,
        timeout,
        ban,
        pubMessage
      })
    }
  })
  // normal subscriptions <- this should reward coins
  chatClient.onSub(async (channel, _user, subInfo) => {
    await onSub(channel, subInfo, { sendMessage, sendFeedMessage, pubMessage })
  })
  // extend subscriptions <- this should not reward coins
  // chatClient.onSubExtend((channel, user, subInfo) => {
  //   console.log(`${channel} ${user} sub extend ${JSON.stringify(subInfo)}`)
  // })
  // resubscriptions <- this should reward coins
  chatClient.onResub(async (channel, _user, subInfo) => {
    await onSub(channel, subInfo, { sendMessage, sendFeedMessage, pubMessage })
  })
  // gift sub to specific viewer // this will be called by on community sub <- this should reward coins
  chatClient.onSubGift(async (channel, _user, subInfo) => {
    await onSubGift(channel, subInfo, {
      sendMessage,
      sendFeedMessage,
      pubMessage
    })
  })
  // gift sub non specific viewer <- this should reward coins but need to check with onSubGift
  chatClient.onCommunitySub(async (channel, _user, subInfo) => {
    await onCommunitySub(channel, subInfo, { sendMessage, pubMessage })
  })
  // gift paid upgrade <- not sure
  chatClient.onGiftPaidUpgrade((channel, user, subInfo) => {
    console.log(`${channel} ${user} paid upgrade ${JSON.stringify(subInfo)}`)
  })
  // gift a gift sub to non specific viewer <- not sure
  chatClient.onCommunityPayForward((channel, user, forwardInfo) => {
    console.log(`${channel} ${user} pay forward ${JSON.stringify(forwardInfo)}`)
  })
  // gift a gift sub specific viewer <- not sure
  chatClient.onStandardPayForward((channel, user, forwardInfo) => {
    console.log(`${channel} ${user} pay forward ${JSON.stringify(forwardInfo)}`)
  })
  // reward gift !!??
  chatClient.onRewardGift((channel, user, giftInfo) => {
    console.log(`${channel} ${user} reward gift ${JSON.stringify(giftInfo)}`)
  })
  // gift sub non specific viewer using prime <- this should reward coins
  chatClient.onPrimeCommunityGift((channel, user, subInfo) => {
    console.log(`${channel} ${user} prime gift sub ${JSON.stringify(subInfo)}`)
  })
  // prime paid upgrade <- not sure
  chatClient.onPrimePaidUpgrade((channel, user, subInfo) => {
    console.log(
      `${channel} ${user} prime paid upgrade ${JSON.stringify(subInfo)}`
    )
  })
  // TODO: Add watchtime function
  // user join channel
  chatClient.onJoin((_channel, _user) => {
    // console.log(`${channel} ${user} joined`)
  })
  // user part channel
  chatClient.onPart((_channel, _user) => {
    // console.log(`${channel} ${user} parted`)
  })
  // user timeout
  chatClient.onTimeout((channel, user, duration) => {
    console.log(`${channel} ${user} timed out for ${duration}`)
  })
  // user banned
  chatClient.onBan((channel, user) => {
    console.log(`${channel} ${user} was banned`)
  })
  // not sure if this called when raid or be raided
  chatClient.onRaid(async (channel, _user, raidInfo) => {
    await onRaid(channel, raidInfo, { sendFeedMessage, pubMessage })
  })
  return chatClient
}
