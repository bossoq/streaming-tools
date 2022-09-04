import type { TwitchCommand } from '../types'

const youtube: TwitchCommand = {
  name: ['!yt', '!youtube'],
  execute: async (_client, channel, _user, _message, tag, misc) => {
    const youtubeUrl =
      process.env.YOUTUBE_LINK || 'https://www.youtube.com/SniffsLive'
    await misc?.sendMessage!(
      channel,
      `${tag.userInfo.displayName} ช่องร้างของแมว ${youtubeUrl}`
    )
  }
}

export default youtube
