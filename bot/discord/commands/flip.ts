import prisma from '../../backend/Prisma'
import { SlashCommandBuilder } from '@discordjs/builders'
import { ExtendsInteraction } from '../lib/MessageEmbed'
import { preparedCoinFlip } from '../lib/PreparedMessage'
import { ably } from '../../backend/AblySub'

const fliprate = parseInt(process.env.COIN_FLIP_RATE || '50')
const flipthreshold = parseInt(process.env.COIN_FLIP_THRESHOLD || '100')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('flip')
    .setDescription('Guess flip coin with h or t')
    .addStringOption((option) =>
      option.setName('side').setDescription('Input h or t').setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName('coin')
        .setDescription('Input number of coin to use')
        .setRequired(true)
    ),
  async execute(interaction: ExtendsInteraction): Promise<void> {
    const discordId = interaction.member?.user.id
    const side = interaction.options.getString('side')?.toLowerCase() || ''
    const playCoin = interaction.options.getInteger('coin') || 1
    const userInfo = await prisma.userInfo.findUnique({
      select: { twitchName: true, coin: true },
      where: { discordId }
    })
    if (!['h', 't'].includes(side)) {
      interaction.reply({
        content: 'ใส่ด้านเหรียญที่จะทอยเป็น h หรือ t เท่านั้นนะ',
        ephemeral: true
      })
      return
    }
    if (userInfo) {
      const twitchName = userInfo.twitchName!
      if (twitchName) {
        const userCoin = Number(userInfo.coin)
        if (userCoin && userCoin >= playCoin) {
          const flip = ['h', 't']
          const flipRand =
            Math.floor(
              Math.random() * (playCoin > flipthreshold ? fliprate : 100)
            ) > fliprate
          const tossResult = String(
            flip.find((toss) => (flipRand ? toss === side : toss !== side))
          )
          const coinLeft = flipRand ? userCoin + playCoin : userCoin - playCoin
          const channel = ably.channels.get('webfeed')
          const response = await prisma.userInfo.update({
            where: { twitchName },
            data: { coin: coinLeft }
          })
          if (!response) return
          const message = {
            username: twitchName,
            winside: tossResult === 'h' ? 'หัว' : 'ก้อย',
            coinleft: coinLeft,
            win: tossResult === side,
            prize: playCoin * 2
          }
          const payload = {
            type: 'coinflipFeed',
            message,
            timeout: 10000
          }
          channel.publish('feedmessage', JSON.stringify(payload))
          channel.publish('coinflip', JSON.stringify(message))
          const { embeds } = preparedCoinFlip(message)
          interaction.reply({
            embeds,
            ephemeral: true
          })
        } else {
          interaction.reply({
            content: 'ไม่มีเงินแล้วยังจะเล่นอีก',
            ephemeral: true
          })
        }
      } else {
        interaction.reply({
          content:
            'ยังผูก Twitch ID กับ SniffsBot ไม่สมบูรณ์นะ ใช้คำสั่ง /auth อีกครั้ง',
          ephemeral: true
        })
      }
    } else {
      interaction.reply({
        content: 'ยังไม่ได้ผูก Twitch ID กับ SniffsBot เลย ใช้คำสั่ง /auth นะ',
        ephemeral: true
      })
    }
  }
}
