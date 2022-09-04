import type { TwitchCommand } from '../types'

const facebook: TwitchCommand = {
  name: ['!fb', '!facebook'],
  execute: async (_client, channel, _user, _message, tag, misc) => {
    const facebookUrl =
      process.env.FACEBOOK_LINK || 'https://www.facebook.com/sniffslive/'
    await misc?.sendMessage!(
      channel,
      `${tag.userInfo.displayName} เพจแมว ${facebookUrl}`
    )
  }
}

export default facebook
