import prisma from '../../backend/Prisma'
import type { TwitchCommand } from '../types'

const coin: TwitchCommand = {
  name: '!coin',
  execute: async (client, channel, _user, _message, tag, misc) => {
    const env =
      (await misc?.redis?.hGet('twitchBotStat', 'env')) === 'production'
    const user = await prisma.userInfo.findUnique({
      where: { twitchId: tag.userInfo.userId }
    })

    if (user) {
      if (env) {
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
