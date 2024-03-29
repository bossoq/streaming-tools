import type { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage'
import { logger } from '../logger'
import type { TwitchMisc } from './types'

const globalCooldown = [
  '!uptime',
  '!dis',
  '!discord',
  '!fb',
  '!facebook',
  '!yt',
  '!youtube',
  '!ig',
  '!instagram',
  '!cmd',
  '!command',
  '!commands',
  '!np',
  '!tip',
  '!tipme'
]
const bypassCooldown = [
  '!env',
  '!market',
  '!webfeed',
  '!payday',
  '!give',
  '!callhell',
  '!sr',
  '!song',
  '!kill',
  '!lotto',
  '!raffle',
  '!flip',
  '!transfer',
  '!shoutout',
  '!so'
]
const defaultCooldown = 20 * 1000

export const checkCooldown = async (
  channel: string,
  command: string,
  tag: TwitchPrivateMessage,
  misc: TwitchMisc
): Promise<boolean> => {
  if (tag.userInfo.isBroadcaster || tag.userInfo.isMod) return true
  if (bypassCooldown.includes(command)) return true
  const timestampNow = Date.now()
  let cooldown: number
  switch (command) {
    case '!sr':
      cooldown = 120 * 1000
      break
    case '!flip':
      cooldown = 5 * 1000
      break
    default:
      cooldown = defaultCooldown
      break
  }
  if (globalCooldown.includes(command)) {
    const lastUsed = parseInt(
      (await misc.redis?.hGet(`${command}-cooldown`, 'global')) || '0'
    )
    if (timestampNow - lastUsed > cooldown) {
      await misc.redis?.hSet(
        `${command}-cooldown`,
        'global',
        timestampNow.toString()
      )
      logger.verbose(
        `[TWITCH] ${channel} ${tag.userInfo.displayName} successfully used ${command}`
      )
      return true
    } else {
      logger.verbose(
        `[TWITCH] ${channel} ${tag.userInfo.displayName} failed to use ${command} (cooldown)`
      )
      return false
    }
  } else {
    const lastUsed = parseInt(
      (await misc.redis?.hGet(`${command}-cooldown`, tag.userInfo.userId)) ||
        '0'
    )
    if (timestampNow - lastUsed > cooldown) {
      await misc.redis?.hSet(
        `${command}-cooldown`,
        tag.userInfo.userId,
        timestampNow.toString()
      )
      logger.verbose(
        `[TWITCH] ${channel} ${tag.userInfo.displayName} successfully used ${command}`
      )
      return true
    } else {
      logger.verbose(
        `[TWITCH] ${channel} ${tag.userInfo.displayName} failed to use ${command} (cooldown)`
      )
      return false
    }
  }
}
