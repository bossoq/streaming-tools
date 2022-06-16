import { botState } from '../../backend/state'
import type { TwitchCommand } from '../types'

const market: TwitchCommand = {
  name: '!market',
  execute: async (client, channel, _user, message, tag) => {
    if (!tag.userInfo.isBroadcaster && !tag.userInfo.isMod) return
    const matches = message.match(/^!market (open)?(close)?/)

    if (matches) {
      const [, open, close] = matches
      const state = await botState.getState('marketOpen')
      if (open) {
        if (!state) {
          botState.setState('marketOpen', true)
          await client.say(channel, 'เปิดตลาดแล้วจ้าาาา~ sniffsBaby sniffsBaby')
        }
      } else if (close) {
        if (state) {
          botState.setState('marketOpen', false)
          await client.say(channel, 'ปิดตลาดแล้วจ้าาาา~ sniffsBaby sniffsBaby')
        }
      }
    }
  }
}

export default market
