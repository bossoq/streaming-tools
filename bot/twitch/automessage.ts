import type { ChatClient } from '@twurple/chat'
import type { createClient } from 'redis'

export class AutoMessage {
  private promiseClient: Promise<ChatClient>
  private client: ChatClient
  private redis: ReturnType<typeof createClient>
  private lottoInterval: NodeJS.Timeout

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
    clearInterval(this.lottoInterval)
  }
}
