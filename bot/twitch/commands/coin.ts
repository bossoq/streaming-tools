import prisma from '../../backend/Prisma'
import { upsertUser } from '../../backend/prismaUtils'
import type { TwitchCommand } from '../types'

const coin: TwitchCommand = {
  name: '!coin',
  execute: async (client, channel, _user, _message, tag) => {
    await upsertUser(tag.userInfo.userId, tag.userInfo.userName)

    const user = await prisma.userInfo.findUnique({
      where: { twitchId: tag.userInfo.userId }
    })

    if (user) {
      if (process.env.ENV == 'prod') {
        client.say(
          channel,
          `${tag.userInfo.userName} มี ${user.coin} sniffscoin sniffsAH`
        )
      } else {
        console.log(
          `${tag.userInfo.userName} มี ${user.coin} sniffscoin sniffsAH`
        )
      }
    }
  }
}

export default coin
