import prisma from '../../backend/Prisma'
import { twitchApiClient } from '../../index'
import { upsertUser } from '../../backend/prismaUtils'
import type { TwitchCommand } from '../types'
import { logger } from '../../logger'

const deduct: TwitchCommand = {
  name: '!deduct',
  execute: async (_client, channel, _user, message, tag, misc) => {
    if (!tag.userInfo.isBroadcaster && !tag.userInfo.isMod) return

    const [_, recipentNameArg, ...args] = message.split(/\s+/)
    if (!recipentNameArg) return

    let amount = 1

    if (args.length) {
      let group = args[0].match(/(-?\d+)/)
      if (group && group[1]) {
        amount = Number.parseInt(group[1])
      }
    }

    if (amount <= 0) return

    const recipentMatch = recipentNameArg.match(/^@?(\w+)$/)
    let recipentName: string
    if (recipentMatch && recipentMatch[1]) {
      recipentName = recipentMatch[1].toLowerCase()
    } else {
      return
    }

    const recipentTag = await twitchApiClient.users.getUserByName(recipentName)
    if (!recipentTag) return
    await upsertUser(recipentTag.name, recipentTag.id)
    await prisma.userInfo.update({
      where: { twitchId: recipentTag.id },
      data: { coin: { decrement: amount } }
    })

    logger.info(
      `[TWITCH] ${channel} ${recipentTag.name} deducted ${amount} coin by ${tag.userInfo.displayName}`
    )
    await misc?.sendFeedMessage!(
      channel,
      `${recipentTag.displayName} ถูกหัก ${amount} sniffscoin`
    )
    const messageFeed = {
      username: recipentTag.displayName,
      coin: amount
    }
    const payload = {
      type: 'deductcoinfeed',
      message: messageFeed,
      timeout: 10000
    }
    misc?.pubMessage!('webfeed', 'feedmessage', JSON.stringify(payload))
  }
}

export default deduct
