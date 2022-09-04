import type { TwitchCommand } from '../types'

const discord: TwitchCommand = {
  name: ['!tip', '!tipme'],
  execute: async (_client, channel, _user, _message, tag, misc) => {
    const tipmeUrl = process.env.TIPME_LINK || 'https://tipme.in.th/sniffslive'
    await misc?.sendMessage!(
      channel,
      `${tag.userInfo.displayName} ให้กัญชาได้ที่ ${tipmeUrl}`
    )
  }
}

export default discord
