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
import { updateWatchTime } from './watchtime'
import { logger } from '../logger'
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
    requestMembershipEvents: true
  })
  await chatClient.connect().catch(console.error)
  chatClient.onRegister(() => {
    logger.info(`[TWITCH] #${channelName} Connected to Twitch as ${botNick}`)
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
      logger.verbose(`[TWITCH] ${channel} ${botNick} ${message}`)
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
      logger.verbose(`[TWITCH] ${channel} ${botNick} ${message}`)
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
      logger.verbose(
        `[TWITCH] ${channel} ${botNick} timeout ${userName} for ${
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
      logger.verbose(
        `[TWITCH] ${channel} ${botNick} ban ${userName} with reason: ${
          reason ?? 'โดนลงดาบนะจ๊ะ'
        }`
      )
    }
  }

  chatClient.onMessage(async (channel, user, message, tag) => {
    const subMonth = parseInt(tag.userInfo.badgeInfo.get('subscriber') || '0')
    await upsertUser(tag.userInfo.userName, tag.userInfo.userId, subMonth)
    logger.verbose(`[TWITCH] ${channel} ${user} ${message}`)
    if (tag.isCheer) {
      logger.verbose(`[TWITCH] ${channel} ${user} cheered ${tag.bits} bits`)
      await onBits(channel, tag, subMonth, {
        redis: redisClient,
        sendMessage,
        sendFeedMessage,
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
    const cooldown = await checkCooldown(channel, commandStr, tag, {
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
    logger.verbose(`[TWITCH] ${channel} ${subInfo.displayName} subscribed`)
    await onSub(channel, subInfo, { sendMessage, sendFeedMessage, pubMessage })
  })
  // extend subscriptions <- this should not reward coins
  chatClient.onSubExtend((channel, user, subInfo) => {
    logger.verbose(
      `[TWITCH] ${channel} ${user} extend subscription ${JSON.stringify(
        subInfo
      )}`
    )
  })
  // resubscriptions <- this should reward coins
  chatClient.onResub(async (channel, _user, subInfo) => {
    logger.verbose(`[TWITCH] ${channel} ${subInfo.displayName} resubscribed`)
    await onSub(channel, subInfo, { sendMessage, sendFeedMessage, pubMessage })
  })
  // gift sub to specific viewer // this will be called by on community sub <- this should reward coins
  chatClient.onSubGift(async (channel, _user, subInfo) => {
    logger.verbose(
      `[TWITCH] ${channel} ${
        subInfo.gifter ? subInfo.gifterDisplayName : 'Anonymous'
      } gifted to ${subInfo.displayName}`
    )
    await onSubGift(channel, subInfo, {
      sendMessage,
      sendFeedMessage,
      pubMessage
    })
  })
  // gift sub non specific viewer <- this should reward coins but need to check with onSubGift
  chatClient.onCommunitySub(async (channel, _user, subInfo) => {
    logger.verbose(
      `[TWITCH] ${channel} ${
        subInfo.gifter ? subInfo.gifterDisplayName : 'Anonymous'
      } gifted ${subInfo.count} subs`
    )
    await onCommunitySub(channel, subInfo, {
      sendMessage,
      sendFeedMessage,
      pubMessage
    })
  })
  // gift paid upgrade <- not sure
  chatClient.onGiftPaidUpgrade((channel, user, subInfo) => {
    logger.verbose(
      `[TWITCH] ${channel} ${user} paid upgrade ${JSON.stringify(subInfo)}`
    )
  })
  // gift a gift sub to non specific viewer <- not sure
  chatClient.onCommunityPayForward((channel, user, forwardInfo) => {
    logger.verbose(
      `[TWITCH] ${channel} ${user} community pay forward ${JSON.stringify(
        forwardInfo
      )}`
    )
  })
  // gift a gift sub specific viewer <- not sure
  chatClient.onStandardPayForward((channel, user, forwardInfo) => {
    logger.verbose(
      `[TWITCH] ${channel} ${user} standard pay forward ${JSON.stringify(
        forwardInfo
      )}`
    )
  })
  // reward gift !!??
  chatClient.onRewardGift((channel, user, giftInfo) => {
    logger.verbose(
      `[TWITCH] ${channel} ${user} reward gift ${JSON.stringify(giftInfo)}`
    )
  })
  // gift sub non specific viewer using prime <- this should reward coins
  chatClient.onPrimeCommunityGift((channel, user, subInfo) => {
    logger.verbose(
      `[TWITCH] ${channel} ${user} prime community gift ${JSON.stringify(
        subInfo
      )}`
    )
  })
  // prime paid upgrade <- not sure
  chatClient.onPrimePaidUpgrade((channel, user, subInfo) => {
    logger.verbose(
      `[TWITCH] ${channel} ${user} prime paid upgrade ${JSON.stringify(
        subInfo
      )}`
    )
  })
  // user join channel
  chatClient.onJoin(async (channel, user) => {
    logger.verbose(`[TWITCH] ${channel} ${user} joined`)
    await updateWatchTime(channel, user, 'join', { redis: redisClient })
  })
  // user part channel
  chatClient.onPart(async (channel, user) => {
    logger.verbose(`[TWITCH] ${channel} ${user} parted`)
    await updateWatchTime(channel, user, 'part', { redis: redisClient })
  })
  // user timeout
  chatClient.onTimeout((channel, user, duration) => {
    logger.verbose(
      `[TWITCH] ${channel} ${user} timeout for ${duration} seconds`
    )
  })
  // user banned
  chatClient.onBan((channel, user) => {
    logger.verbose(`[TWITCH] ${channel} ${user} banned`)
  })
  // not sure if this called when raid or be raided
  chatClient.onRaid(async (channel, _user, raidInfo) => {
    logger.verbose(
      `[TWITCH] ${channel} ${raidInfo.displayName} raided ${raidInfo.viewerCount} viewers`
    )
    await onRaid(channel, raidInfo, {
      sendMessage,
      sendFeedMessage,
      pubMessage
    })
  })
  return chatClient
}
