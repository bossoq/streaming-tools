import prisma from '../../backend/Prisma'
import { updateWatchTime } from '../watchtime'
import type { TwitchCommand } from '../types'

const watchtime: TwitchCommand = {
  name: '!watchtime',
  execute: async (_client, channel, _user, _message, tag, misc) => {
    let watchtime = 0
    await updateWatchTime(tag.userInfo.userName, 'update', misc!)

    const userData = await prisma.userInfo.findUnique({
      select: { watchTime: true },
      where: { twitchId: tag.userInfo.userId }
    })
    if (userData) watchtime = Number(userData.watchTime)

    if (watchtime > 0) {
      let day, hour, minute, second
      day = hour = minute = second = 0
      day = Math.floor(watchtime / 86400)
      hour = Math.floor((watchtime % 86400) / 3600)
      minute = Math.floor((watchtime % 3600) / 60)
      second = Math.floor(watchtime % 60)
      let respText = `${tag.userInfo.displayName} ดูไลฟ์มาแล้ว`
      if (day > 0) respText += ` ${day} วัน`
      if (hour > 0) respText += ` ${hour} ชั่วโมง`
      if (minute > 0) respText += ` ${minute} นาที`
      if (second > 0) respText += ` ${second} วินาที`
      respText += ' น้าาา sniffsHeart sniffsHeart sniffsHeart'
      await misc?.sendMessage!(channel, respText)
    } else {
      await misc?.sendMessage!(
        channel,
        `${tag.userInfo.displayName} เพิ่งมาดู ${channel} สิน้าาาาา sniffsAH`
      )
    }
    return
  }
}

export default watchtime
