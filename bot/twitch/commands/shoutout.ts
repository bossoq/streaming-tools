import { twitchApiClient } from '../../index'
import { logger } from '../../logger'
import { shoutOut } from '../actions'
import type { TwitchCommand } from '../types'

const shoutout: TwitchCommand = {
  name: ['!so', '!shoutout'],
  execute: async (_client, channel, _user, message, tag, misc) => {
    if (!tag.userInfo.isBroadcaster && !tag.userInfo.isMod) return

    const [_, targetNameArg] = message.split(/\s+/)
    if (!targetNameArg) return

    const targetNameMatch = targetNameArg.match(/^@?(\w+)$/)
    let targetName: string
    if (targetNameMatch && targetNameMatch[1]) {
      targetName = targetNameMatch[1].toLowerCase()
    } else {
      return
    }

    const targetTag = await twitchApiClient.users.getUserByName(targetName)
    if (!targetTag) return

    logger.verbose(
      `[TWITCH] ${channel} ${tag.userInfo.displayName} shoutout ${targetTag.displayName}`
    )
    await shoutOut(channel, targetTag.displayName, misc!)
  }
}

export default shoutout
