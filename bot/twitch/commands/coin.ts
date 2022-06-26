import prisma from '../../backend/Prisma'
import type { TwitchCommand } from '../types'

const coin: TwitchCommand = {
  name: '!coin',
  execute: async (_client, channel, _user, _message, tag, misc) => {
    const user = await prisma.userInfo.findUnique({
      select: { coin: true },
      where: { twitchId: tag.userInfo.userId }
    })

    if (user) {
      await misc?.sendMessage!(
        channel,
        `${tag.userInfo.userName} มี ${user.coin} sniffscoin sniffsAH`
      )
    }
  }
}

export default coin
