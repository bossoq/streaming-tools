import { autoMessage, twitchApiClient } from '../index'
import type { createClient } from 'redis'

export const initializeStat = async (
  redis: ReturnType<typeof createClient>
) => {
  const streamInfo = await twitchApiClient.streams.getStreamByUserName(
    process.env.TWITCH_CHANNEL_NAME || 'bosssoq'
  )
  const isLive = (await redis.hGet('twitchBotStat', 'isLive')) === 'true'
  if (streamInfo?.type === 'live' && !isLive) {
    await redis.hSet('twitchBotStat', 'isLive', 'true')
    await redis.hSet(
      'twitchBotStat',
      'startDate',
      streamInfo?.startDate.toString()
    )
  } else if (streamInfo?.type !== 'live' && isLive) {
    await redis.hSet('twitchBotStat', 'isLive', 'false')
    await redis.hDel('twitchBotStat', 'startDate')
  }
  const feedEnable = await redis.hGet('twitchBotStat', 'feedEnable')
  if (!feedEnable) {
    await redis.hSet('twitchBotStat', 'feedEnable', 'on')
  }
  const lottoCount = await redis.hGet('twitchBotStat', 'user-lotto-count')
  if (!lottoCount) {
    await redis.hSet('twitchBotStat', 'user-lotto-count', '0')
  }
  const marketOpen = await redis.hGet('twitchBotStat', 'market')
  if (!marketOpen) {
    await redis.hSet('twitchBotStat', 'market', 'open')
  }
  const lottoOpen = await redis.hGet('twitchBotStat', 'lotto')
  if (!lottoOpen) {
    await redis.hSet('twitchBotStat', 'lotto', 'close')
  }
  if (streamInfo?.type === 'live') {
    await autoMessage.flipAnnounce()
    await autoMessage.tipmeAnnounce()
    await autoMessage.giveCoin()
  }
  if (streamInfo?.type === 'live' && lottoOpen === 'open')
    await autoMessage.lottoAnnounce()
}
