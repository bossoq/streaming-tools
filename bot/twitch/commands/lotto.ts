import { autoMessage } from '../../index'
import { logger } from '../../logger'
import { buyLotto, drawLotto } from '../lotto'
import type { TwitchCommand } from '../types'

const lotto: TwitchCommand = {
  name: '!lotto',
  execute: async (_client, channel, _user, message, tag, misc) => {
    const lottoOpen =
      (await misc?.redis?.hGet('twitchBotStat', 'lotto')) === 'open'
    const checkRole = tag.userInfo.isBroadcaster || tag.userInfo.isMod
    const [_, arg, ...rest] = message.split(/\s+/)
    if (!arg) return

    switch (arg) {
      case 'start':
        if (checkRole) {
          if (!lottoOpen) {
            logger.info(
              `[TWITCH] ${channel} ${tag.userInfo.displayName} start lotto system`
            )
            await misc?.redis?.hSet('twitchBotStat', 'lotto', 'open')
            const message = {
              status: true
            }
            const payload = {
              type: 'lottoStat',
              message,
              timeout: 30000
            }
            misc?.pubMessage!('webfeed', 'feedmessage', JSON.stringify(payload))
          }
        }
        await autoMessage.lottoAnnounce()
        break
      case 'stop':
        if (checkRole) {
          if (lottoOpen) {
            logger.info(
              `[TWITCH] ${channel} ${tag.userInfo.displayName} stop lotto system`
            )
            await misc?.redis?.hSet('twitchBotStat', 'lotto', 'close')
            const message = {
              status: false
            }
            const payload = {
              type: 'lottoStat',
              message,
              timeout: 30000
            }
            await misc?.sendMessage!(channel, 'ปิดการซื้อ SniffsLotto แล้วจ้า')
            misc?.pubMessage!('webfeed', 'feedmessage', JSON.stringify(payload))
          }
        }
        autoMessage.clearLottoAnnounce()
        break
      case 'draw':
        if (checkRole) {
          if (lottoOpen) {
            logger.info(
              `[TWITCH] ${channel} ${tag.userInfo.displayName} stop lotto system`
            )
            await misc?.redis?.hSet('twitchBotStat', 'lotto', 'close')
            const message = {
              status: false
            }
            const payload = {
              type: 'lottoStat',
              message,
              timeout: 30000
            }
            await misc?.sendMessage!(channel, 'ปิดการซื้อ SniffsLotto แล้วจ้า')
            misc?.pubMessage!('webfeed', 'feedmessage', JSON.stringify(payload))
          }
          logger.info(
            `[TWITCH] ${channel} ${tag.userInfo.displayName} draw lotto`
          )
          autoMessage.clearLottoAnnounce()
          await drawLotto(channel, misc!)
        }
        break
      default:
        if (lottoOpen) {
          let lottoNumber: string
          let countNumber = 1
          const matchNumber = arg.match(/(^\d{2}$)/)
          if (matchNumber && matchNumber[1]) {
            lottoNumber = matchNumber[1]
          } else {
            return
          }
          if (rest.length) {
            const matchCount = rest[0].match(/(^\d+$)/)
            if (matchCount && matchCount[1]) {
              countNumber = Number.parseInt(matchCount[1])
            }
          }
          if (countNumber <= 0) countNumber = 1
          await buyLotto(channel, tag, misc!, lottoNumber, countNumber)
        }
        return
    }
  }
}

export default lotto
