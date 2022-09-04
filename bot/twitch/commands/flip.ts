import prisma from '../../backend/Prisma'
import type { TwitchCommand } from '../types'
import { logger } from '../../logger'

const flip: TwitchCommand = {
  name: '!flip',
  execute: async (_client, channel, _user, message, tag, misc) => {
    const marketOpen =
      (await misc?.redis?.hGet('twitchBotStat', 'market')) === 'open'
    const checkRole =
      tag.userInfo.isBroadcaster ||
      tag.userInfo.isMod ||
      tag.userInfo.isSubscriber
    if (!marketOpen && !checkRole) return

    const [_, arg, ...rest] = message.split(/\s+/)

    const acceptArg = ['h', 't', 'head', 'tail']
    if (!acceptArg.includes(arg))
      await misc?.sendMessage!(
        channel,
        'ใส่ด้านของเหรียญตามนี้เท่านั้นนะ! [h, t, head, tail]'
      )

    let bet = 1
    if (rest.length) {
      const matchCount = rest[0].match(/(^\d+$)/)
      if (matchCount && matchCount[1]) {
        bet = Number.parseInt(matchCount[1])
      }
    }
    if (bet <= 0) bet = 1

    const userData = await prisma.userInfo.findUnique({
      select: { coin: true },
      where: { twitchId: tag.userInfo.userId }
    })
    if (!userData) return

    if (Number(userData.coin) < bet) {
      await misc?.sendMessage!(
        channel,
        `${tag.userInfo.displayName} ไม่มีเงินแล้วยังจะซื้ออีก!`
      )
      return
    }

    await prisma.userInfo.update({
      where: { twitchId: tag.userInfo.userId },
      data: { coin: { decrement: bet } }
    })

    let mod = 100
    let flipRate = parseInt(process.env.COIN_FLIP_RATE || '50')
    let flipResult = false
    let winSide: string
    if (bet > parseInt(process.env.COIN_FLIP_THRESHOLD || '100000'))
      mod = flipRate
    if (Math.floor(Math.random() * mod) > flipRate) flipResult = true

    switch (arg) {
      case 'h':
      case 'head':
        if (flipResult) {
          winSide = 'หัว'
        } else {
          winSide = 'ก้อย'
        }
        break
      case 't':
      case 'tail':
        if (flipResult) {
          winSide = 'ก้อย'
        } else {
          winSide = 'หัว'
        }
        break
      default:
        return
    }

    logger.info(
      `[TWITCH] ${channel} ${tag.userInfo.displayName} ${
        flipResult ? 'win' : 'lose'
      } ${bet} coin`
    )
    if (flipResult) {
      await prisma.userInfo.update({
        where: { twitchId: tag.userInfo.userId },
        data: { coin: { increment: bet * 2 } }
      })
      await misc?.sendFeedMessage!(
        channel,
        `เหรียญออกที่${winSide} ต้าว ${tag.userInfo.displayName} ได้รับ ${
          bet * 2
        } sniffscoin`
      )
    } else {
      await misc?.sendFeedMessage!(
        channel,
        `วะฮ่าๆ เหรียญออก${winSide} โดนกิงง ${tag.userInfo.displayName}`
      )
    }
    const messageFeed = {
      username: tag.userInfo.displayName,
      winside: winSide,
      coinleft: flipResult
        ? Number(userData.coin) + bet
        : Number(userData.coin) - bet,
      win: flipResult,
      prize: flipResult ? bet * 2 : 0
    }
    const payload = {
      type: 'coinflipFeed',
      message: messageFeed,
      timeout: 10000
    }
    misc?.pubMessage!('webfeed', 'feedmessage', JSON.stringify(payload))
    misc?.pubMessage!('webfeed', 'coinflip', JSON.stringify(messageFeed))
  }
}

export default flip
