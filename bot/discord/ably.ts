import { subMessage } from './lib/AblySub'
import {
  preparedLiveNotify,
  preparedCoinFlip,
  preparedLottoBuy,
  preparedLottoDraw,
  preparedRaffleBuy,
  preparedRaffleDraw
} from './lib/PreparedMessage'
import { discordClient } from '../index'
import type { Types } from 'ably'

const announceChannel = process.env.DISCORD_ANNOUNCE_CHANNEL || ''
const allowChannel = process.env.DISCORD_BOTLOG_CHANNEL || ''

export const ablyMessage = () => {
  subMessage('webfeed', async (message: Types.Message) => {
    switch (message.name) {
      case 'livemessage':
        await discordClient.sendMessage(
          announceChannel,
          preparedLiveNotify(JSON.parse(message.data))
        )
        break
      case 'coinflip':
        await discordClient.sendMessage(
          allowChannel,
          preparedCoinFlip(JSON.parse(message.data))
        )
        break
      case 'lottobuy':
        await discordClient.sendMessage(
          allowChannel,
          preparedLottoBuy(JSON.parse(message.data))
        )
        break
      case 'lottodraw':
        await discordClient.sendMessage(
          allowChannel,
          preparedLottoDraw(JSON.parse(message.data))
        )
        break
      case 'rafflebuy':
        await discordClient.sendMessage(
          allowChannel,
          preparedRaffleBuy(JSON.parse(message.data))
        )
        break
      case 'raffledraw':
        await discordClient.sendMessage(
          allowChannel,
          preparedRaffleDraw(JSON.parse(message.data))
        )
        break
      default:
        break
    }
  })
}
