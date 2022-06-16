import prisma from '../../backend/Prisma'
import { SlashCommandBuilder } from '@discordjs/builders'
import { MessageEmbed } from 'discord.js'
import { embedMessageBuilder, ExtendsInteraction } from '../lib/MessageEmbed'
import { getCoin } from '../../backend/prismaUtils'

module.exports = {
  data: new SlashCommandBuilder()
    .setName('coin')
    .setDescription('Retrieve Sniffscoin amount!')
    .addStringOption((option) =>
      option
        .setName('twitchid')
        .setDescription('Input Twitch ID')
        .setRequired(false)
    ),
  async execute(interaction: ExtendsInteraction): Promise<void> {
    const discordId = interaction.member?.user.id
    let twitchId: string | undefined
    let inputId = interaction.options.getString('twitchid')
    if (!inputId) {
      const response = await prisma.twitchlink.findUnique({
        select: { twitchId: true },
        where: { discordId }
      })
      if (response) {
        if (response.twitchId) {
          twitchId = response.twitchId
        }
      }
    } else {
      twitchId = inputId
    }
    let coin: number | undefined | null
    if (twitchId) {
      coin = await getCoin(twitchId.toLowerCase())
    }
    let resp: MessageEmbed
    if (coin) {
      resp = embedMessageBuilder([
        {
          name: `<${twitchId}>`,
          value: `มียอดคงเหลือ ${coin} Sniffscoin`
        }
      ])
    } else {
      resp = embedMessageBuilder([
        {
          name: `<${twitchId ? twitchId : 'ไม่ใส่ Username'}>`,
          value: `ไม่พบ Username นี้ โปรใส่ Twitch Username...`
        }
      ])
    }
    interaction.reply({
      embeds: [resp],
      ephemeral: true
    })
  }
}
