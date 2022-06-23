import prisma from '../backend/Prisma'
// import { bulkCoin } from '../backend/prismaUtils'
// import type { ChatClient } from '@twurple/chat'
import type { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage'
import type { EventSubStreamOnlineEvent } from '@twurple/eventsub/lib'
import type { TwitchMisc } from './types'

export const sendLiveNotify = async (
  event: EventSubStreamOnlineEvent,
  misc: TwitchMisc
) => {
  await misc.redis!.hSet('twitchBotStat', 'isLive', 'true')
  const streamInfo = await event.getStream()
  const message = {
    userName: event.broadcasterDisplayName,
    title: streamInfo.title,
    gameName: streamInfo.gameName,
    viewers: streamInfo.viewers,
    thumbnailUrl: streamInfo.thumbnailUrl
  }
  misc.pubMessage!('webfeed', 'livemessage', JSON.stringify(message))
}

export const handleChannelPoints = async (tag: TwitchPrivateMessage) => {
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
    await prisma.userInfo.update({
      where: { twitchId: tag.userInfo.userId },
      data: { coin: { increment: coinAmount } }
    })
    misc.sendMessage!(
      channel,
      `${tag.userInfo.userName} ได้รับ ${coinAmount} sniffscoin จากการ Bit จำนวน ${tag.bits} bit sniffsHeart sniffsHeart sniffsHeart`
    )
  } else {
    misc.sendMessage!(
      channel,
      `ขอบคุณ ${tag.userInfo.userName} สำหรับ ${tag.bits} บิทค้าาา sniffsHeart sniffsHeart sniffsHeart`
    )
  }
}

export const onSubs = async () => {}
