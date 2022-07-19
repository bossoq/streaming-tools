import type { TwitchCommand } from '../types'

const discord: TwitchCommand = {
  name: ['!tip', '!tipme'],
  execute: async (_client, channel, _user, _message, tag, misc) => {
    const tipmeUrl =
      process.env.TIPME_LINK || 'https://tipme.in.th/9c7b073691de260013ea2906'
    await misc?.sendMessage!(
      channel,
      `${tag.userInfo.displayName} ให้อาหารแมวได้ที่ ${tipmeUrl} sniffsBaby`
    )
  }
}

export default discord
