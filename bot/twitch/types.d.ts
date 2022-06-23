import type { ChatClient } from '@twurple/chat'
import type { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage'
import type { createClient } from 'redis'

export interface TwitchCommand {
  name: string
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
}
