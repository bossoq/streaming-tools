import type { TwitchCommand } from '../types'

const webfeed: TwitchCommand = {
  name: '!webfeed',
  execute: async (_client, channel, _user, message, tag, misc) => {
    if (!tag.userInfo.isBroadcaster && !tag.userInfo.isMod) return
    const matches = message.match(/^!webfeed (on)?(off)?/)

    if (matches) {
      const [, on, off] = matches
      const state =
        (await misc?.redis?.hGet('twitchBotStat', 'feedEnable')) === 'on'
      if (on) {
        if (!state) {
          await misc?.redis?.hSet('twitchBotStat', 'feedEnable', 'on')
          await misc?.sendMessage!(channel, 'Webfeed System started sniffsAH')
          const message = {
            status: true
          }
          const payload = {
            type: 'webfeed',
            message,
            timeout: 30000
          }
          misc?.pubMessage!('webfeed', 'feedmessage', JSON.stringify(payload))
        }
      } else if (off) {
        if (state) {
          await misc?.redis?.hSet('twitchBotStat', 'feedEnable', 'off')
          await misc?.sendMessage!(channel, 'Webfeed System stopped sniffsAH')
          const message = {
            status: false
          }
          const payload = {
            type: 'webfeed',
            message,
            timeout: 30000
          }
          misc?.pubMessage!('webfeed', 'feedmessage', JSON.stringify(payload))
        }
      }
    }
  }
}

export default webfeed
