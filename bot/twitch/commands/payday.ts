import { bulkCoin } from '../../backend/prismaUtils'
import { logger } from '../../logger'
import type { TwitchCommand } from '../types'

const payday: TwitchCommand = {
  name: '!payday',
  execute: async (_client, channel, _user, message, tag, misc) => {
    if (!tag.userInfo.isBroadcaster && !tag.userInfo.isMod) return

    const [_, ...args] = message.split(/\s+/)

    let amount = 1

    if (args.length) {
      let group = args[0].match(/(-?\d+)/)
      if (group && group[1]) {
        amount = Number.parseInt(group[1])
      }
    }

    if (amount <= 0) return

    const chatterLength = await bulkCoin(channel, amount)

    logger.info(
      `[TWITCH] ${channel} ${tag.userInfo.displayName} payday ${amount} coins to ${chatterLength} users`
    )
    await misc?.sendFeedMessage!(
      channel,
      `ผู้ชมทั้งหมด ${chatterLength} คน ได้รับ ${amount} sniffscoin`
    )
    const messageFeed = {
      coin: amount,
      viewer: chatterLength
    }
    const payload = {
      type: 'paydayfeed',
      message: messageFeed,
      timeout: 10000
    }
    misc?.pubMessage!('webfeed', 'feedmessage', JSON.stringify(payload))
  }
}

export default payday
