import type { TwitchCommand } from '../types'

const discord: TwitchCommand = {
  name: ['!dis', '!discord'],
  execute: async (_client, channel, _user, _message, tag, misc) => {
    const discordUrl =
      process.env.DISCORD_LINK || 'https://discord.gg/Q3AMaHQEGU'
    await misc?.sendMessage!(
      channel,
      `${tag.userInfo.displayName} มาคุยกันได้ใน Discord ${discordUrl} sniffsBaby`
    )
  }
}

export default discord
