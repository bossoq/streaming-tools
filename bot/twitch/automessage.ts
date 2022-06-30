import type { ChatClient } from '@twurple/chat'
import type { createClient } from 'redis'
import { bulkCoin } from '../backend/prismaUtils'

export class AutoMessage {
  private promiseClient: Promise<ChatClient>
  private client: ChatClient
  private redis: ReturnType<typeof createClient>
  private lottoInterval: NodeJS.Timeout | undefined
  private flipInterval: NodeJS.Timeout | undefined
  private coinInterval: NodeJS.Timeout | undefined

  constructor(
    client: Promise<ChatClient>,
    redisClient: ReturnType<typeof createClient>
  ) {
    this.promiseClient = client
    this.redis = redisClient
  }
  async initClient() {
    this.client = await this.promiseClient
  }
  async lottoAnnounce() {
    const announce =
      'sniffsHi เร่เข้ามาเร่เข้ามา SniffsLotto ใบละ 5 coins !lotto ตามด้วยเลข 2 หลัก ประกาศรางวัลตอนปิดไลฟ์จ้า sniffsAH'
    const channelName = `#${process.env.TWITCH_CHANNEL_NAME}` || '#bosssoq'
    if (
      this.lottoInterval ||
      (await this.redis.hGet('twitchBotStat', 'lotto')) !== 'open'
    )
      return
    if ((await this.redis.hGet('twitchBotStat', 'env')) !== 'production') return
    await this.client.say(channelName, announce)
    this.lottoInterval = setInterval(async () => {
      await this.client.say(channelName, announce)
    }, 20 * 60 * 1000)
  }
  clearLottoAnnounce() {
    clearInterval(this.lottoInterval!)
    this.lottoInterval = undefined
  }
  async flipAnnounce() {
    const announce =
      'sniffsHi เร่เข้ามาเร่เข้ามา ปั่นแปะจ้า ปั่นแปะ !flip ตามด้วย h หรือ t sniffsAH'
    const channelName = `#${process.env.TWITCH_CHANNEL_NAME}` || '#bosssoq'
    console.log(this.flipInterval)
    if (
      this.flipInterval ||
      (await this.redis.hGet('twitchBotStat', 'isLive')) !== 'true'
    )
      return
    if ((await this.redis.hGet('twitchBotStat', 'env')) !== 'production') return
    await this.client.say(channelName, announce)
    this.flipInterval = setInterval(async () => {
      if ((await this.redis.hGet('twitchBotStat', 'isLive')) !== 'true') {
        clearInterval(this.flipInterval!)
        this.flipInterval = undefined
        return
      }
      await this.client.say(channelName, announce)
    }, 5 * 60 * 1000)
  }
  clearFlipAnnounce() {
    clearInterval(this.flipInterval!)
    this.flipInterval = undefined
  }
  async giveCoin() {
    const channelName = `#${process.env.TWITCH_CHANNEL_NAME}` || '#bosssoq'
    if (
      this.coinInterval ||
      (await this.redis.hGet('twitchBotStat', 'isLive')) !== 'true'
    )
      return
    this.coinInterval = setInterval(async () => {
      if ((await this.redis.hGet('twitchBotStat', 'isLive')) !== 'true') {
        clearInterval(this.coinInterval!)
        this.coinInterval = undefined
        return
      }
      await bulkCoin(channelName, 1)
    }, 60 * 60 * 1000)
  }
  clearCoinInterval() {
    clearInterval(this.coinInterval!)
    this.coinInterval = undefined
  }
}
