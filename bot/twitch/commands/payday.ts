import { bulkCoin } from '../../backend/prismaUtils'
import type { TwitchCommand } from '../types'

const payday: TwitchCommand = {
  name: '!payday',
  execute: async (client, channel, _user, message, tag, misc) => {
    const env =
      (await misc?.redis?.hGet('twitchBotStat', 'env')) === 'production'
    if (!tag.userInfo.isBroadcaster && !tag.userInfo.isMod) return

    const [_, ...args] = message.split(/\s+/)

    let amount = 1

    if (args.length) {
      let group = args[0].match(/(-?\d+)/)
      if (group && group[1]) {
        amount = Number.parseInt(group[1])
      }
    }

    const chatterLength = await bulkCoin(channel, amount)

    if (env) {
      client.say(
        channel,
        `ผู้ชมทั้งหมด ${chatterLength} คน ได้รับ ${amount} sniffscoin sniffsAH`
      )
    } else {
      console.log(
        `ผู้ชมทั้งหมด ${chatterLength} คน ได้รับ ${amount} sniffscoin sniffsAH`
      )
    }
  }
}

export default payday
