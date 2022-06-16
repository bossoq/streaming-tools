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
    await prisma.userInfoDev.createMany({
      data: chatterWithId.map((v) => ({ userId: v.id, userName: v.name })),
      skipDuplicates: true
    })
    // add coin
    await prisma.userInfoDev.updateMany({
      data: {
        coin: {
          increment: amount
        }
      },
      where: {
        userId: { in: chatterWithId.map((v) => v.id) }
      }
    })

    client.say(
      channel,
      `ผู้ชมทั้งหมด ${chatterList.length} คน ได้รับ ${amount} sniffscoin sniffsAH`
    )
  }
}

export default payday
