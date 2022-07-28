import { logger } from '../../logger'
import type { TwitchCommand } from '../types'

const env: TwitchCommand = {
  name: '!env',
  execute: async (client, channel, _user, message, tag, misc) => {
    if (!tag.userInfo.isBroadcaster && !tag.userInfo.isMod) return
    const env =
      (await misc?.redis?.hGet('twitchBotStat', 'env')) === 'production'

    const matches = message.match(/^!env (prod)?(dev)?/)

    if (matches) {
      const [, prod, dev] = matches
      if (prod && !env) {
        await misc?.redis?.hSet('twitchBotStat', 'env', 'production')
        await client.say(channel, 'Environment set to production')
        logger.info(
          `[TWITCH] ${channel} ${tag.userInfo.displayName} set env to production`
        )
      } else if (dev && env) {
        await misc?.redis?.hSet('twitchBotStat', 'env', 'development')
        await client.say(channel, 'Environment set to development')
        logger.info(
          `[TWITCH] ${channel} ${tag.userInfo.displayName} set env to development`
        )
      }
    }
  }
}

export default env
