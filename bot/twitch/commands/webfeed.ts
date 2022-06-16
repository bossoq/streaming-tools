import { botState } from '../../backend/state'
import type { TwitchCommand } from '../types'

const webfeed: TwitchCommand = {
  name: '!webfeed',
  execute: async (client, channel, _user, message, tag) => {
    if (!tag.userInfo.isBroadcaster && !tag.userInfo.isMod) return
    const matches = message.match(/^!webfeed (on)?(off)?/)

    if (matches) {
      const [, on, off] = matches
      const state = await botState.getState('feedEnable')
      if (on) {
        if (!state) {
          botState.setState('feedEnable', true)
          await client.say(channel, 'Webfeed System started sniffsAH')
        }
      } else if (off) {
        if (state) {
          botState.setState('feedEnable', false)
          await client.say(channel, 'Webfeed System stopped sniffsAH')
        }
      }
    }
  }
}

export default webfeed
