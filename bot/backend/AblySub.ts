import Ably from 'ably/promises'
import type { Types } from 'ably'

const ablyKey = process.env.ABLY_KEY || ''

export const ably = new Ably.Realtime(ablyKey)

export const subMessage = (
  channelName: string,
  callbackonMessage: CallableFunction
): Types.RealtimeChannelPromise => {
  const channel: Types.RealtimeChannelPromise = ably.channels.get(channelName)

  channel.subscribe((msg: Types.Message) => {
    callbackonMessage(msg)
  })

  return channel
}
