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
    let twitchName: string | undefined
    let inputId = interaction.options.getString('twitchid')
    let coin: number | undefined | null
    if (!inputId) {
      const response = await prisma.userInfo.findUnique({
        select: { twitchName: true, coin: true },
        where: { discordId }
      })
      if (response) {
        twitchName = response.twitchName!
        coin = Number(response.coin!)
      }
    } else {
      twitchName = inputId
      coin = await getCoin(twitchName.toLowerCase())
    }
    let resp: MessageEmbed
    if (coin) {
      resp = embedMessageBuilder([
        {
          name: `<${twitchName}>`,
          value: `มียอดคงเหลือ ${coin} Sniffscoin`
        }
      ])
    } else {
      resp = embedMessageBuilder([
        {
          name: `<${twitchName ? twitchName : 'ไม่ใส่ Username'}>`,
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
