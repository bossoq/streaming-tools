import prisma from '../backend/Prisma'
import { autoMessage } from '../index'
import { bulkCoin, upsertUser } from '../backend/prismaUtils'
import type { ChatClient } from '@twurple/chat'
import type { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage'
import type {
  EventSubStreamOfflineEvent,
  EventSubStreamOnlineEvent
} from '@twurple/eventsub/lib'
import type {
  ChatCommunitySubInfo,
  ChatRaidInfo,
  ChatSubGiftInfo,
  ChatSubInfo
} from '@twurple/chat/lib'
import type { TwitchMisc } from './types'
import { forceUpdateWatchTime } from './watchtime'

export const sendLiveNotify = async (
  client: ChatClient,
  event: EventSubStreamOnlineEvent,
  misc: TwitchMisc
) => {
  await misc.redis!.hSet('twitchBotStat', 'isLive', 'true')
  const streamInfo = await event.getStream()
  const broadcastInfo = await event.getBroadcaster()
  const message = {
    userName: event.broadcasterDisplayName,
    title: streamInfo.title,
    gameName: streamInfo.gameName,
    viewers: streamInfo.viewers,
    thumbnailUrl: streamInfo.thumbnailUrl,
    profileUrl: broadcastInfo.profilePictureUrl
  }
  await misc.redis!.hSet(
    'twitchBotStat',
    'startDate',
    event.startDate.getTime()
  )
  await misc.redis!.hSet('twitchBotStat', 'watchTimeSystem', 'start')
  await client.say(
    `#${event.broadcasterName}`,
    `${event.broadcasterDisplayName} แมวมา`
  )
  misc.pubMessage!('webfeed', 'livemessage', JSON.stringify(message))
  await autoMessage.flipAnnounce()
  await autoMessage.tipmeAnnounce()
  // await autoMessage.giveCoin()
  await autoMessage.watchTime()
  await bulkCoin(`#${event.broadcasterName}`, 5)
}

export const sendOfflineNotify = async (
  client: ChatClient,
  event: EventSubStreamOfflineEvent,
  misc: TwitchMisc
) => {
  await forceUpdateWatchTime(`#${event.broadcasterName}`, misc)
  await misc.redis!.hSet('twitchBotStat', 'watchTimeSystem', 'stop')
  await misc.redis!.hSet('twitchBotStat', 'isLive', 'false')
  await client.say(
    `#${event.broadcasterName}`,
    `${event.broadcasterDisplayName} แมวไปนอนละ`
  )
  autoMessage.clearFlipAnnounce()
  autoMessage.clearTipmeAnnounce()
  // autoMessage.clearCoinInterval()
  autoMessage.clearWatchTimeInterval()
}

export const handleChannelPoints = async (
  tag: TwitchPrivateMessage,
  subMonth: number
) => {
  const group = tag.rawLine?.match(/custom-reward-id=(\w+-\w+-\w+-\w+-\w+)/)
  if (group && group[1]) {
    let coinAmount: number
    switch (group[1]) {
      case 'e80c4383-ee96-41cd-94ab-b232adc47f8f':
        coinAmount = 1
        break
      case '8b3458b8-f0bf-4218-b046-829c506279e5':
        coinAmount = 5
        break
      case 'd7c3ca2f-2372-4209-9804-9dd6e28eea34':
        coinAmount = 10
        break
      default:
        return
    }
    await upsertUser(tag.userInfo.userName, tag.userInfo.userId, subMonth)
    await prisma.userInfo.update({
      where: { twitchId: tag.userInfo.userId },
      data: { coin: { increment: coinAmount } }
    })
  }
}

export const onBits = async (
  channel: string,
  tag: TwitchPrivateMessage,
  subMonth: number,
  misc: TwitchMisc
) => {
  const mod_rate = Math.min(subMonth, 10) / 100
  const coinAmount = Math.floor((tag.bits / 50) * (1 + mod_rate))
  if (coinAmount > 0) {
    await upsertUser(tag.userInfo.userName, tag.userInfo.userId, subMonth)
    await prisma.userInfo.update({
      where: { twitchId: tag.userInfo.userId },
      data: { coin: { increment: coinAmount } }
    })
    await misc.sendFeedMessage!(
      channel,
      `${tag.userInfo.userName} ได้รับ ${coinAmount} sniffscoin จากการ Bit จำนวน ${tag.bits} bit`
    )
    const message = {
      username: tag.userInfo.userName,
      coin: coinAmount,
      bits: tag.bits
    }
    const payload = {
      type: 'bitfeed',
      message,
      timeout: 10000
    }
    misc.pubMessage!('webfeed', 'feedmessage', JSON.stringify(payload))
  } else {
    await misc.sendMessage!(
      channel,
      `ขอบคุณ ${tag.userInfo.userName} สำหรับ ${tag.bits} บิทขนมแมวเลีย`
    )
  }
}

export const onSub = async (
  channel: string,
  subInfo: ChatSubInfo,
  misc: TwitchMisc
) => {
  const subMonth = subInfo.months
  let coinAmount: number
  let planSelect: string
  switch (subInfo.plan) {
    case '1000':
      coinAmount = 5
      planSelect = '1'
      break
    case '2000':
      coinAmount = 10
      planSelect = '2'
      break
    case '3000':
      coinAmount = 25
      planSelect = '3'
      break
    default:
      coinAmount = 5
      planSelect = 'Prime'
      break
  }
  await upsertUser(subInfo.displayName.toLowerCase(), subInfo.userId, subMonth)
  await prisma.userInfo.update({
    where: { twitchId: subInfo.userId },
    data: { coin: { increment: coinAmount } }
  })
  const chatterLength = await bulkCoin(channel, 1)

  await misc.sendMessage!(
    channel,
    `ต้าว ${subInfo.displayName} จงมาเป็งทาสแมวว`
  )
  await misc.sendFeedMessage!(
    channel,
    `${subInfo.displayName} ได้รับ ${coinAmount} sniffscoin จากการซับระดับ ${planSelect} และผู้ชมทั้งหมด ${chatterLength} คนได้รับ 1 sniffscoin`
  )

  const message = {
    username: subInfo.displayName,
    coin: coinAmount,
    plan: planSelect,
    viewer: chatterLength
  }
  const payload = {
    type: 'subPayout',
    message,
    timeout: 10000
  }
  misc.pubMessage!('webfeed', 'feedmessage', JSON.stringify(payload))
}

export const onSubGift = async (
  channel: string,
  subInfo: ChatSubGiftInfo,
  misc: TwitchMisc
) => {
  const subMonth = subInfo.months
  let coinAmount: number
  let planSelect: string
  switch (subInfo.plan) {
    case '1000':
      coinAmount = 5
      planSelect = '1'
      break
    case '2000':
      coinAmount = 10
      planSelect = '2'
      break
    case '3000':
      coinAmount = 25
      planSelect = '3'
      break
    default:
      coinAmount = 5
      planSelect = 'Prime'
      break
  }
  await upsertUser(subInfo.displayName.toLowerCase(), subInfo.userId, subMonth)
  const chatterLength = await bulkCoin(channel, 1)
  await prisma.userInfo.update({
    where: { twitchId: subInfo.userId },
    data: { coin: { increment: coinAmount } }
  })
  if (subInfo.gifter && subInfo.gifterUserId) {
    await upsertUser(subInfo.gifter, subInfo.gifterUserId)
    await prisma.userInfo.update({
      where: { twitchId: subInfo.gifterUserId },
      data: { coin: { increment: coinAmount } }
    })
    await misc.sendFeedMessage!(
      channel,
      `${subInfo.gifterDisplayName} ได้รับ ${coinAmount} sniffscoin จากการ Gift ให้ ${subInfo.displayName} ระดับ ${planSelect}`
    )
    await misc.sendFeedMessage!(
      channel,
      `${subInfo.displayName} ได้รับ ${coinAmount} sniffscoin จากการได้รับ Gift ระดับ ${planSelect} และผู้ชมทั้งหมด ${chatterLength} คนได้รับ 1 sniffscoin`
    )
    const message = {
      username: subInfo.gifterDisplayName,
      recipent: subInfo.displayName,
      coin: coinAmount,
      plan: planSelect,
      viewer: chatterLength
    }
    const payload = {
      type: 'giftSubPayout',
      message,
      timeout: 10000
    }
    misc.pubMessage!('webfeed', 'feedmessage', JSON.stringify(payload))
  } else {
    await misc.sendFeedMessage!(
      channel,
      `ขอบคุณ Gift ระดับ ${planSelect} จากทาสแมวนิรนามนะคะ`
    )
    await misc.sendFeedMessage!(
      channel,
      `${subInfo.displayName} ได้รับ ${coinAmount} sniffscoin จากการได้รับ Gift ระดับ ${planSelect} และผู้ชมทั้งหมด ${chatterLength} คนได้รับ 1 sniffscoin`
    )
    const message = {
      recipent: subInfo.displayName,
      coin: coinAmount,
      plan: planSelect,
      viewer: chatterLength
    }
    const payload = {
      type: 'anonGiftSubPayout',
      message,
      timeout: 10000
    }
    misc.pubMessage!('webfeed', 'feedmessage', JSON.stringify(payload))
  }
}

export const onCommunitySub = async (
  channel: string,
  subInfo: ChatCommunitySubInfo,
  misc: TwitchMisc
) => {
  let coinAmount: number
  let planSelect: string
  switch (subInfo.plan) {
    case '1000':
      coinAmount = 5 * subInfo.count
      planSelect = '1'
      break
    case '2000':
      coinAmount = 10 * subInfo.count
      planSelect = '2'
      break
    case '3000':
      coinAmount = 25 * subInfo.count
      planSelect = '3'
      break
    default:
      coinAmount = 5 * subInfo.count
      planSelect = 'Prime'
      break
  }
  if (subInfo.gifter && subInfo.gifterUserId) {
    await misc.sendFeedMessage!(
      channel,
      `${subInfo.gifterDisplayName} ได้รับ ${coinAmount} sniffscoin จากการ Gift ระดับ ${planSelect} ให้สมาชิก ${subInfo.count} คน`
    )
    const message = {
      username: subInfo.gifterDisplayName,
      coin: coinAmount,
      giftCount: subInfo.count,
      plan: planSelect
    }
    const payload = {
      type: 'giftMystSubPayout',
      message,
      timeout: 10000
    }
    misc.pubMessage!('webfeed', 'feedmessage', JSON.stringify(payload))
  } else {
    await misc.sendMessage!(
      channel,
      `ขอบคุณ Gift ระดับ ${planSelect} จากทาสแมวนิรนามนะคะจำนวน ${subInfo.count} กิฟ`
    )
  }
}

export const onRaid = async (
  channel: string,
  raidInfo: ChatRaidInfo,
  misc: TwitchMisc
) => {
  misc.sendFeedMessage!(
    channel,
    `ขอบคุณ ${raidInfo.displayName} ที่ส่งทาสแมวมาจำนวน ${raidInfo.viewerCount} คน ด้วยน้าา`
  )
  await shoutOut(channel, raidInfo.displayName, misc)
  const message = {
    username: raidInfo.displayName,
    viewer: raidInfo.viewerCount
  }
  const payload = {
    type: 'raidfeed',
    message,
    timeout: 10000
  }
  misc.pubMessage!('webfeed', 'feedmessage', JSON.stringify(payload))
}

export const shoutOut = async (
  channel: string,
  displayName: string,
  misc: TwitchMisc
) => {
  const message = `ฝากติดตามช่อง ${displayName} ด้วยน้าา twitch.tv/${displayName.toLowerCase()}`
  misc.sendMessage!(channel, message)
}
