import type { ChatClient } from '@twurple/chat'
import type { TwitchPrivateMessage } from '@twurple/chat'

export interface TwitchCommand {
  name: string
  execute: (
    client: ChatClient,
    channel: string,
    userName: string,
    message: string,
    tag: TwitchPrivateMessage,
    misc?: {
      discord?: string
    }
  ) => void
}
