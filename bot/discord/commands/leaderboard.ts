import prisma from '../../backend/Prisma'
import { SlashCommandBuilder } from '@discordjs/builders'
import { embedMessageBuilder, ExtendsInteraction } from '../lib/MessageEmbed'

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Retrieve Sniffscoin Leaderboard!'),
  async execute(interaction: ExtendsInteraction): Promise<void> {
    const leaderboard = await prisma.userInfo.findMany({
      select: { twitchName: true, coin: true },
      take: 20,
      orderBy: { coin: 'desc' }
    })
    if (leaderboard.length) {
      const resp = embedMessageBuilder(
        leaderboard.map((player, idx) => ({
          name: player.twitchName!,
          value: player.coin!.toString(),
          inline: idx >= 5
        }))
      )
      resp
        .setTitle('รายชื่อผู้ร่ำรวย Sniffscoin')
        .setDescription('กลุ่มต้าวๆที่ถือครองเหรียญ Sniffs มากที่สุดในขณะนี้')
        .setThumbnail(
          'https://teopwbuwkgtwnhmddsuj.supabase.in/storage/v1/object/public/sniffsbot-asset/images/sniffsbaby.png'
        )
      interaction.reply({
        embeds: [resp],
        ephemeral: true
      })
    } else {
      interaction.reply({
        content: 'ไม่สามารถดึงข้อมูลเหรียญได้',
        ephemeral: true
      })
    }
  }
}
