import type { TwitchCommand } from '../types'

const webfeed: TwitchCommand = {
  name: '!webfeed',
  execute: async (client, channel, _user, message, tag, misc) => {
    if (!tag.userInfo.isBroadcaster && !tag.userInfo.isMod) return
    const matches = message.match(/^!webfeed (on)?(off)?/)

    if (matches) {
      const [, on, off] = matches
      const state =
        (await misc?.redis?.hGet('twitchBotStat', 'feedEnable')) === 'on'
      if (on) {
        if (!state) {
          await misc?.redis?.hSet('twitchBotStat', 'feedEnable', 'on')
          if (process.env.ENV == 'prod') {
            await client.say(channel, 'Webfeed System started sniffsAH')
          } else {
            console.log('Webfeed System started sniffsAH')
          }
        }
      } else if (off) {
        if (state) {
          await misc?.redis?.hSet('twitchBotStat', 'feedEnable', 'off')
          if (process.env.ENV == 'prod') {
            await client.say(channel, 'Webfeed System stopped sniffsAH')
          } else {
            console.log('Webfeed System stopped sniffsAH')
          }
        }
      }
    }
  }
}

export default webfeed
