import type { TwitchCommand } from '../types'

const youtube: TwitchCommand = {
  name: ['!yt', '!youtube'],
  execute: async (_client, channel, _user, _message, tag, misc) => {
    const youtubeUrl = 'https://www.youtube.com/SniffsLive'
    await misc?.sendMessage!(
      channel,
      `${tag.userInfo.displayName} Channel ร้างของสนิฟเอง ${youtubeUrl} sniffsBaby`
    )
  }
}

export default youtube
