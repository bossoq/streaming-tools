import type { TwitchCommand } from '../types'

const market: TwitchCommand = {
  name: '!market',
  execute: async (client, channel, _user, message, tag, misc) => {
    if (!tag.userInfo.isBroadcaster && !tag.userInfo.isMod) return
    const matches = message.match(/^!market (open)?(close)?/)

    if (matches) {
      const [, open, close] = matches
      const state =
        (await misc?.redis?.hGet('twitchBotStat', 'market')) === 'open'
      if (open) {
        if (!state) {
          await misc?.redis?.hSet('twitchBotStat', 'market', 'open')
          if (process.env.ENV == 'prod') {
            await client.say(
              channel,
              'เปิดตลาดแล้วจ้าาาา~ sniffsBaby sniffsBaby'
            )
          } else {
            console.log('เปิดตลาดแล้วจ้าาาา~ sniffsBaby sniffsBaby')
          }
        }
      } else if (close) {
        if (state) {
          await misc?.redis?.hSet('twitchBotStat', 'market', 'close')
          if (process.env.ENV == 'prod') {
            await client.say(
              channel,
              'ปิดตลาดแล้วจ้าาาา~ sniffsBaby sniffsBaby'
            )
          } else {
            console.log('ปิดตลาดแล้วจ้าาาา~ sniffsBaby sniffsBaby')
          }
        }
      }
    }
  }
}

export default market
