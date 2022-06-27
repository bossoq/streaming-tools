import type { TwitchCommand } from '../types'

const instagram: TwitchCommand = {
  name: ['!ig', '!instagram'],
  execute: async (_client, channel, _user, _message, tag, misc) => {
    const instagramUrl =
      process.env.INSTAGRAM_LINK || 'https://www.instagram.com/musicsn/'
    await misc?.sendMessage!(
      channel,
      `${tag.userInfo.displayName} IG ของสนิฟ ${instagramUrl} sniffsBaby`
    )
  }
}

export default instagram
