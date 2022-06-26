import type { TwitchCommand } from '../types'

const uptime: TwitchCommand = {
  name: '!uptime',
  execute: async (_client, channel, _user, _message, tag, misc) => {
    const isLive =
      (await misc?.redis!.hGet('twitchBotStat', 'isLive')) === 'true'
    if (isLive) {
      const startDate = new Date(
        (await misc?.redis!.hGet('twitchBotStat', 'startDate')) || ''
      )
      const now = new Date()
      const uptime = Math.floor((now.getTime() - startDate.getTime()) / 1000)
      if (uptime > 0) {
        let day, hour, minute, second
        day = hour = minute = second = 0
        day = Math.floor(uptime / 86400)
        hour = Math.floor((uptime % 86400) / 3600)
        minute = Math.floor((uptime % 3600) / 60)
        second = Math.floor(uptime % 60)
        let respText = `${tag.userInfo.displayName} สนิฟไลฟ์มาแล้ว`
        if (day > 0) respText += ` ${day} วัน`
        if (hour > 0) respText += ` ${hour} ชั่วโมง`
        if (minute > 0) respText += ` ${minute} นาที`
        if (second > 0) respText += ` ${second} วินาที`
        respText += ' น้าาา sniffsHeart sniffsHeart sniffsHeart'
        await misc?.sendMessage!(channel, respText)
      } else {
        await misc?.sendMessage!(
          channel,
          'ยังไม่ถึงเวลาไลฟ์น้าาาา sniffsHeart sniffsHeart sniffsHeart'
        )
      }
      return
    } else {
      await misc?.sendMessage!(
        channel,
        'ยังไม่ถึงเวลาไลฟ์น้าาาา sniffsHeart sniffsHeart sniffsHeart'
      )
    }
  }
}

export default uptime
