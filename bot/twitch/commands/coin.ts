import prisma from '../../backend/Prisma'
import { logger } from '../../logger'
import type { TwitchCommand } from '../types'

const coin: TwitchCommand = {
  name: '!coin',
  execute: async (_client, channel, _user, _message, tag, misc) => {
    const marketOpen =
      (await misc?.redis?.hGet('twitchBotStat', 'market')) === 'open'
    const checkRole =
      tag.userInfo.isBroadcaster ||
      tag.userInfo.isMod ||
      tag.userInfo.isSubscriber
    if (!marketOpen && !checkRole) return
    const user = await prisma.userInfo.findUnique({
      select: { coin: true },
      where: { twitchId: tag.userInfo.userId }
    })

    if (user) {
      logger.info(
        `[TWITCH] ${channel} ${tag.userInfo.displayName} has ${user.coin} coin`
      )
      await misc?.sendMessage!(
        channel,
        `${tag.userInfo.userName} มี ${user.coin} sniffscoin`
      )
    }
  }
}

export default coin
