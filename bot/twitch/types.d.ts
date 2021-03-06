import type { ChatClient } from '@twurple/chat'
import type { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage'
import type { createClient } from 'redis'

export interface TwitchCommand {
  name: string | string[]
  execute: (
    client: ChatClient,
    channel: string,
    userName: string,
    message: string,
    tag: TwitchPrivateMessage,
    misc?: TwitchMisc
  ) => void
}

export interface TwitchMisc {
  redis?: ReturnType<typeof createClient>
  sendMessage?: (channel: string, message: string) => Promise<void>
  sendFeedMessage?: (channel: string, message: string) => Promise<void>
  timeout?: (
    channel: string,
    userName: string,
    duration?: number,
    reason?: string
  ) => Promise<void>
  ban?: (channel: string, userName: string, reason?: string) => Promise<void>
  pubMessage?: (channelName: string, name: string, data: string) => void
}

export interface watchTimeData {
  status: 'join' | 'part'
  lastJoin: number
}
