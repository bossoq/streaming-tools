import prisma from '../backend/Prisma'
// import { bulkCoin } from '../backend/prismaUtils'
import type { ChatClient } from '@twurple/chat'
import type { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage'
import type { TwitchMisc } from './types'

export const onBits = async (
  client: ChatClient,
  channel: string,
  tag: TwitchPrivateMessage,
  subMonth: number,
  misc: TwitchMisc
) => {
  const env = (await misc?.redis?.hGet('twitchBotStat', 'env')) === 'production'
  const mod_rate = Math.min(subMonth, 10) / 100
  const coinAmount = Math.floor((tag.bits / 50) * (1 + mod_rate))
  if (coinAmount > 0) {
    await prisma.userInfo.update({
      where: { twitchId: tag.userInfo.userId },
      data: { coin: { increment: coinAmount } }
    })
    if (env) {
      client.say(
        channel,
        `${tag.userInfo.userName} ได้รับ ${coinAmount} sniffscoin จากการ Bit จำนวน ${tag.bits} bit sniffsHeart sniffsHeart sniffsHeart`
      )
    } else {
      console.log(
        `${tag.userInfo.userName} ได้รับ ${coinAmount} sniffscoin จากการ Bit จำนวน ${tag.bits} bit sniffsHeart sniffsHeart sniffsHeart`
      )
    }
  } else {
    if (env) {
      client.say(
        channel,
        `ขอบคุณ ${tag.userInfo.userName} สำหรับ ${tag.bits} บิทค้าาา sniffsHeart sniffsHeart sniffsHeart`
      )
    } else {
      console.log(
        `ขอบคุณ ${tag.userInfo.userName} สำหรับ ${tag.bits} บิทค้าาา sniffsHeart sniffsHeart sniffsHeart`
      )
    }
  }
}

export const onSubs = async () => {}
