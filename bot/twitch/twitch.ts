import fs from 'node:fs'
import { StaticAuthProvider } from '@twurple/auth'
import { ChatClient } from '@twurple/chat'
import type { createClient } from 'redis'
import type { TwitchCommand } from './types'

const clientId = process.env.TWITCH_CLIENT_ID || ''
const accessToken = process.env.TWITCH_ACCESS_TOKEN || ''
const botNick = process.env.TWITCH_BOT_NICK || ''
const channelName = process.env.TWITCH_CHANNEL_NAME || ''

export const twitchClient = async (
  redisClient: ReturnType<typeof createClient>
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
    commands.set(command.name, command)
  }

  chatClient.onMessage((channel, user, message, tag) => {
    // console.log(`${channel} ${user}: ${message}`)
    if (tag.isCheer) {
      console.log(
        `isBits: ${tag.isCheer}, bits: ${tag.bits}, channelId: ${tag.channelId}, messageId: ${tag.id}`
      )
    }
    // console.log(
    //   `userId: ${tag.userInfo.userId}, userName: ${
    //     tag.userInfo.userName
    //   }, displayName: ${tag.userInfo.displayName}, isBroadcaster: ${
    //     tag.userInfo.isBroadcaster
    //   }, isFounder: ${tag.userInfo.isFounder}, isMod: ${
    //     tag.userInfo.isMod
    //   }, isSubscriber: ${tag.userInfo.isSubscriber}, isVIP: ${
    //     tag.userInfo.isVip
    //   }, subMonth: ${tag.userInfo.badgeInfo.get('subscriber') || 0}`
    // )
    if (user === botNick) return

    const commandStr = message
      .toLowerCase()
      .split(' ')[0]
      .replace(/(!\w+)(!\w+)*/, '$1')

    const command = commands.get(commandStr)

    if (!command) return

    command.execute(chatClient, channel, user, message, tag, {
      redis: redisClient
    })
  })
  // normal subscriptions <- this should reward coins
  chatClient.onSub((channel, user, subInfo) => {
    console.log(`${channel} ${user} subscribed ${JSON.stringify(subInfo)}`)
  })
  // extend subscriptions <- this should not reward coins
  chatClient.onSubExtend((channel, user, subInfo) => {
    console.log(`${channel} ${user} sub extend ${JSON.stringify(subInfo)}`)
  })
  // resubscriptions <- this should reward coins
  chatClient.onResub((channel, user, subInfo) => {
    console.log(`${channel} ${user} resubscribed ${JSON.stringify(subInfo)}`)
  })
  // gift sub to specific viewer // this will be called by on community sub <- this should reward coins
  chatClient.onSubGift((channel, user, subInfo) => {
    console.log(`${channel} ${user} gifted ${JSON.stringify(subInfo)}`)
  })
  // gift sub non specific viewer <- this should reward coins but need to check with onSubGift
  chatClient.onCommunitySub((channel, user, subInfo) => {
    console.log(`${channel} ${user} gift sub ${JSON.stringify(subInfo)}`)
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
  // user join channel
  chatClient.onJoin((channel, user) => {
    console.log(`${channel} ${user} joined`)
  })
  // user part channel
  chatClient.onPart((channel, user) => {
    console.log(`${channel} ${user} parted`)
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
  chatClient.onRaid((channel, user, raidInfo) => {
    console.log(`${channel} ${user} raid ${JSON.stringify(raidInfo)}`)
  })
  return chatClient
}
