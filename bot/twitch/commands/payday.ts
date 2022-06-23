import { twitchApiClient } from '../../index'
import prisma from '../../backend/Prisma'
import type { TwitchCommand } from '../types'

const payday: TwitchCommand = {
  name: '!payday',
  execute: async (client, channel, _user, message, tag) => {
    if (!tag.userInfo.isBroadcaster && !tag.userInfo.isMod) return

    const [_, ...args] = message.split(/\s+/)

    let amount = 1

    if (args.length) {
      let group = args[0].match(/(-?\d+)/)
      if (group && group[1]) {
        amount = Number.parseInt(group[1])
      }
    }

    const chatterList = (
      await twitchApiClient.unsupported.getChatters(channel.slice(1))
    ).allChatters
    const chatterWithId = await twitchApiClient.users.getUsersByNames(
      chatterList
    )

    // upsert user
    await prisma.userInfo.createMany({
      data: chatterWithId.map((v) => ({ twitchId: v.id, twitchName: v.name })),
      skipDuplicates: true
    })
    // add coin
    await prisma.userInfo.updateMany({
      data: {
        coin: {
          increment: amount
        }
      },
      where: {
        twitchId: { in: chatterWithId.map((v) => v.id) }
      }
    })

    if (process.env.ENV == 'prod') {
      client.say(
        channel,
        `ผู้ชมทั้งหมด ${chatterList.length} คน ได้รับ ${amount} sniffscoin sniffsAH`
      )
    } else {
      console.log(
        `ผู้ชมทั้งหมด ${chatterList.length} คน ได้รับ ${amount} sniffscoin sniffsAH`
      )
    }
  }
}

export default payday
