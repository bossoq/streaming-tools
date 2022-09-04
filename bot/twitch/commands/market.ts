import { logger } from '../../logger'
import type { TwitchCommand } from '../types'

const market: TwitchCommand = {
  name: '!market',
  execute: async (_client, channel, _user, message, tag, misc) => {
    if (!tag.userInfo.isBroadcaster && !tag.userInfo.isMod) return
    const matches = message.match(/^!market (open)?(close)?/)

    if (matches) {
      const [, open, close] = matches
      const state =
        (await misc?.redis?.hGet('twitchBotStat', 'market')) === 'open'
      if (open) {
        if (!state) {
          logger.info(
            `[TWITCH] ${channel} ${tag.userInfo.displayName} open market`
          )
          await misc?.redis?.hSet('twitchBotStat', 'market', 'open')
          await misc?.sendMessage!(channel, 'เปิดตลาดแล้วจ้าาาา~')
        }
      } else if (close) {
        if (state) {
          logger.info(
            `[TWITCH] ${channel} ${tag.userInfo.displayName} close market`
          )
          await misc?.redis?.hSet('twitchBotStat', 'market', 'close')
          await misc?.sendMessage!(channel, 'ปิดตลาดแล้วจ้าาาา~')
        }
      }
    }
  }
}

export default market
