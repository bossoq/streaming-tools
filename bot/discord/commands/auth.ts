import prisma from '../../backend/Prisma'
import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction } from 'discord.js'
import { OAuth2Routes } from 'discord-api-types/v9'
import { randomBytes } from 'crypto'
import { createClient } from 'redis'

const clientId = process.env.DISCORD_CLIENT_ID || ''
const callbackUrl = process.env.TWITCH_CALLBACK_URL || ''
const redisURL = process.env.REDIS_URL || 'redis://localhost:6379'

const redisClient = createClient({ url: redisURL })
redisClient.connect().catch(console.error)

const baseUrl: string = `${
  OAuth2Routes.authorizationURL
}?response_type=code&client_id=${clientId}&scope=identify%20connections&state={state}&redirect_uri=${encodeURIComponent(
  callbackUrl
)}&prompt=consent`

module.exports = {
  data: new SlashCommandBuilder()
    .setName('auth')
    .setDescription('Link your Twitch ID with SniffsBot'),
  async execute(interaction: CommandInteraction): Promise<void> {
    const discordId = interaction.member?.user.id
    const state = randomBytes(20).toString('hex') + discordId
    const userData = await prisma.userInfo.findUnique({
      where: { discordId }
    })
    if (!discordId) {
      interaction.reply({
        content: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ Discord',
        ephemeral: true
      })
      return
    }
    if (!userData?.twitchId) {
      const response = await redisClient.set(`${discordId}-state`, state, {
        EX: 300
      })
      if (response) {
        interaction.reply({
          content: `[คลิกที่นี่เพื่อเชื่อมต่อบัญชี Twitch กับ SniffsBot](${baseUrl.replace(
            '{state}',
            state
          )})`,
          ephemeral: true
        })
      } else {
        interaction.reply({
          content: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้ ลองอีกครั้งทีหลังนะ',
          ephemeral: true
        })
      }
    } else {
      interaction.reply({
        content: `เชื่อมต่อกับ Twitch ID: ${userData.twitchId} แล้วน้าาาา`,
        ephemeral: true
      })
    }
  }
}
