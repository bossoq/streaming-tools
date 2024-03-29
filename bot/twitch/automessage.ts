import { bulkCoin } from '../backend/prismaUtils'
import { maintainDatabase } from '../backend/twitchidmap'
import { forceUpdateWatchTime } from './watchtime'
import type { ChatClient } from '@twurple/chat'
import type { createClient } from 'redis'

export class AutoMessage {
  private promiseClient: Promise<ChatClient>
  private client: ChatClient
  private redis: ReturnType<typeof createClient>
  private lottoInterval: NodeJS.Timeout | undefined
  private flipInterval: NodeJS.Timeout | undefined
  private coinInterval: NodeJS.Timeout | undefined
  private tipmeInterval: NodeJS.Timeout | undefined
  private watchTimeInterval: NodeJS.Timeout | undefined
  private cronjobDatabaseInterval: NodeJS.Timeout | undefined

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
    const announce = 'SniffsLotto ใบละ 5 coins !lotto ตามด้วยเลข 2 หลัก'
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
    if (this.lottoInterval) clearInterval(this.lottoInterval)
    this.lottoInterval = undefined
  }
  async flipAnnounce() {
    const announce = 'ทอยเหรียญ !flip ตามด้วย h หรือ t'
    const channelName = `#${process.env.TWITCH_CHANNEL_NAME}` || '#bosssoq'
    if (
      this.flipInterval ||
      (await this.redis.hGet('twitchBotStat', 'isLive')) !== 'true'
    )
      return
    if ((await this.redis.hGet('twitchBotStat', 'env')) !== 'production') return
    await this.client.say(channelName, announce)
    this.flipInterval = setInterval(async () => {
      if ((await this.redis.hGet('twitchBotStat', 'isLive')) !== 'true') {
        if (this.flipInterval) clearInterval(this.flipInterval)
        this.flipInterval = undefined
        return
      }
      await this.client.say(channelName, announce)
    }, 10 * 60 * 1000)
  }
  clearFlipAnnounce() {
    if (this.flipInterval) clearInterval(this.flipInterval)
    this.flipInterval = undefined
  }
  async tipmeAnnounce() {
    const tipmeUrl =
      process.env.TIPME_LINK || 'https://tipme.in.th/9c7b073691de260013ea2906'
    const announce = `ให้กัญชาแมวได้ที่ ${tipmeUrl}`
    const channelName = `#${process.env.TWITCH_CHANNEL_NAME}` || '#bosssoq'
    if (
      this.tipmeInterval ||
      (await this.redis.hGet('twitchBotStat', 'isLive')) !== 'true'
    )
      return
    if ((await this.redis.hGet('twitchBotStat', 'env')) !== 'production') return
    await this.client.say(channelName, announce)
    this.tipmeInterval = setInterval(async () => {
      if ((await this.redis.hGet('twitchBotStat', 'isLive')) !== 'true') {
        if (this.tipmeInterval) clearInterval(this.tipmeInterval)
        this.tipmeInterval = undefined
        return
      }
      await this.client.say(channelName, announce)
    }, 8 * 60 * 1000)
  }
  clearTipmeAnnounce() {
    if (this.tipmeInterval) clearInterval(this.tipmeInterval)
    this.tipmeInterval = undefined
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
        if (this.coinInterval) clearInterval(this.coinInterval)
        this.coinInterval = undefined
        return
      }
      await bulkCoin(channelName, 1)
    }, 60 * 60 * 1000)
  }
  clearCoinInterval() {
    if (this.coinInterval) clearInterval(this.coinInterval)
    this.coinInterval = undefined
  }
  async watchTime() {
    const channelName = `#${process.env.TWITCH_CHANNEL_NAME}` || '#bosssoq'
    if (
      this.watchTimeInterval ||
      (await this.redis.hGet('twitchBotStat', 'isLive')) !== 'true'
    )
      return
    this.watchTimeInterval = setInterval(async () => {
      if ((await this.redis.hGet('twitchBotStat', 'isLive')) !== 'true') {
        if (this.watchTimeInterval) clearInterval(this.watchTimeInterval)
        this.watchTimeInterval = undefined
        return
      }
      await forceUpdateWatchTime(channelName, { redis: this.redis })
    }, 5 * 60 * 1000)
  }
  clearWatchTimeInterval() {
    if (this.watchTimeInterval) clearInterval(this.watchTimeInterval)
    this.watchTimeInterval = undefined
  }
  async cronjobDatabase() {
    if (this.cronjobDatabaseInterval) return
    this.cronjobDatabaseInterval = setInterval(async () => {
      await maintainDatabase()
    }, 10 * 60 * 1000)
  }
  clearCronjobDatabaseInterval() {
    if (this.cronjobDatabaseInterval)
      clearInterval(this.cronjobDatabaseInterval)
    this.cronjobDatabaseInterval = undefined
  }
}
