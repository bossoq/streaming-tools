import { autoMessage } from '../../index'
import { buyLotto, drawLotto } from '../lotto'
import type { TwitchCommand } from '../types'

const lotto: TwitchCommand = {
  name: '!lotto',
  execute: async (_client, channel, _user, message, tag, misc) => {
    const lottoOpen =
      (await misc?.redis?.hGet('twitchBotStat', 'lotto')) === 'open'
    const checkRole = tag.userInfo.isBroadcaster || tag.userInfo.isMod
    const [_, arg, ...rest] = message.split(/\s+/)

    switch (arg) {
      case 'start':
        if (checkRole) {
          if (!lottoOpen) {
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
            await misc?.redis?.hSet('twitchBotStat', 'lotto', 'close')
            const message = {
              status: false
            }
            const payload = {
              type: 'lottoStat',
              message,
              timeout: 30000
            }
            await misc?.sendMessage!(
              channel,
              'ปิดการซื้อ SniffsLotto แล้วจ้า รอประกาศผลรางวัลเลย sniffsAH'
            )
            misc?.pubMessage!('webfeed', 'feedmessage', JSON.stringify(payload))
          }
        }
        autoMessage.clearLottoAnnounce()
        break
      case 'draw':
        if (checkRole) {
          if (lottoOpen) {
            await misc?.redis?.hSet('twitchBotStat', 'lotto', 'close')
            const message = {
              status: false
            }
            const payload = {
              type: 'lottoStat',
              message,
              timeout: 30000
            }
            await misc?.sendMessage!(
              channel,
              'ปิดการซื้อ SniffsLotto แล้วจ้า รอประกาศผลรางวัลเลย sniffsAH'
            )
            misc?.pubMessage!('webfeed', 'feedmessage', JSON.stringify(payload))
          }
        }
        autoMessage.clearLottoAnnounce()
        await drawLotto(channel, misc!)
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
          console.log(`Buy Lotto ${lottoNumber} ${countNumber}`)
          await buyLotto(channel, tag, misc!, lottoNumber, countNumber)
        }
        return
    }
  }
}

export default lotto
