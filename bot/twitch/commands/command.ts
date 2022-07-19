import type { TwitchCommand } from '../types'

const command: TwitchCommand = {
  name: ['!cmd', '!command', '!commands'],
  execute: async (_client, channel, _user, _message, _tag, misc) => {
    await misc?.sendMessage!(
      channel,
      '!sr ขอเพลง | !coin เช็คเหรียญ | !lotto ซื้อหวย | !kill จ้างมือปืนสนิฟ'
    )
    await misc?.sendMessage!(
      channel,
      '!uptime | !watchtime | !discord | !fb | !yt | !ig | !tip'
    )
  }
}

export default command
