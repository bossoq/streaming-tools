import { autoMessage, twitchApiClient } from '../index'
import type { createClient } from 'redis'
import { forceUpdateWatchTime } from './watchtime'

export const initializeStat = async (
  redis: ReturnType<typeof createClient>
) => {
  const channelName = process.env.TWITCH_CHANNEL_NAME || 'bosssoq'
  const streamInfo = await twitchApiClient.streams.getStreamByUserName(
    channelName
  )
  const feedEnable = await redis.hGet('twitchBotStat', 'feedEnable')
  const lottoCount = await redis.hGet('twitchBotStat', 'user-lotto-count')
  const marketOpen = await redis.hGet('twitchBotStat', 'market')
  const lottoOpen = await redis.hGet('twitchBotStat', 'lotto')
  const isLive = (await redis.hGet('twitchBotStat', 'isLive')) === 'true'
  const watchTimeSystem =
    (await redis.hGet('twitchBotStat', 'watchTimeSystem')) === 'start'
  if (!feedEnable) {
    await redis.hSet('twitchBotStat', 'feedEnable', 'on')
  }
  if (!lottoCount) {
    await redis.hSet('twitchBotStat', 'user-lotto-count', '0')
  }
  if (!marketOpen) {
    await redis.hSet('twitchBotStat', 'market', 'open')
  }
  if (!lottoOpen) {
    await redis.hSet('twitchBotStat', 'lotto', 'close')
  }
  await autoMessage.cronjobDatabase()
  if (streamInfo?.type === 'live') {
    if (!isLive) {
      await redis.hSet('twitchBotStat', 'isLive', 'true')
      await redis.hSet(
        'twitchBotStat',
        'startDate',
        streamInfo?.startDate.getTime()
      )
    }
    if (!watchTimeSystem) {
      await redis.hSet('twitchBotStat', 'watchTimeSystem', 'start')
    }
    await autoMessage.flipAnnounce()
    await autoMessage.tipmeAnnounce()
    // await autoMessage.giveCoin()
    await autoMessage.watchTime()
    if (lottoOpen === 'open') {
      await autoMessage.lottoAnnounce()
    }
  } else {
    if (watchTimeSystem) {
      await forceUpdateWatchTime(`#${channelName}`, { redis })
      await redis.hSet('twitchBotStat', 'watchTimeSystem', 'stop')
    }
    if (isLive) {
      await redis.hSet('twitchBotStat', 'isLive', 'false')
    }
  }
}
