import prisma from '../backend/Prisma'
import type { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage'
import type { TwitchMisc } from './types'

export const buyLotto = async (
  channel: string,
  tag: TwitchPrivateMessage,
  misc: TwitchMisc,
  lottoNumber: string,
  lottoCount: number
) => {
  const lottoCost = 5
  const userData = await prisma.userInfo.findUnique({
    select: { coin: true },
    where: { twitchId: tag.userInfo.userId }
  })
  if (!userData) return
  const totalLottoCount = Math.min(
    Math.floor(Number(userData.coin) / lottoCost),
    lottoCount
  )
  if (totalLottoCount > 0) {
    await prisma.userInfo.update({
      where: { twitchId: tag.userInfo.userId },
      data: { coin: { decrement: lottoCost * totalLottoCount } }
    })
    let data: Record<string, Record<string, any>[]> = {}
    let count = 0

    let dataRaw = await misc.redis?.hGet!('twitchBotStat', 'user-lotto')
    let countRaw = await misc.redis?.hGet!('twitchBotStat', 'user-lotto-count')
    if (dataRaw) data = JSON.parse(dataRaw)
    if (countRaw) {
      count = Number(countRaw)
    }
    count += totalLottoCount

    if (lottoNumber in data) {
      const idx = data[lottoNumber].findIndex(
        (v) => v.twitchId === tag.userInfo.userId
      )
      if (idx === -1) {
        data[lottoNumber].push({
          twitchId: tag.userInfo.userId,
          twitchName: tag.userInfo.userName,
          count: totalLottoCount
        })
      } else {
        data[lottoNumber][idx].count += totalLottoCount
      }
    } else {
      data[lottoNumber] = [
        {
          twitchId: tag.userInfo.userId,
          twitchName: tag.userInfo.userName,
          count: totalLottoCount
        }
      ]
    }
    await misc.redis?.hSet!('twitchBotStat', 'user-lotto', JSON.stringify(data))
    await misc.redis?.hSet!('twitchBotStat', 'user-lotto-count', count)
    await misc.sendMessage!(
      channel,
      `${tag.userInfo.displayName} ซื้อ SniffsLotto หมายเลข ${lottoNumber} จำนวน ${totalLottoCount} ใบ สำเร็จ sniffsHeart sniffsHeart sniffsHeart`
    )
    const message = {
      username: tag.userInfo.displayName,
      lotto: lottoNumber,
      count: totalLottoCount,
      coinleft: Number(userData.coin) - lottoCost * totalLottoCount
    }
    const payload = {
      type: 'buyLottoFeed',
      message,
      timeout: 10000
    }
    misc.pubMessage!('webfeed', 'feedmessage', JSON.stringify(payload))
    misc.pubMessage!('webfeed', 'lottobuy', JSON.stringify(message))
  } else {
    await misc.sendMessage!(
      channel,
      `${tag.userInfo.displayName} ไม่มีเงินแล้วยังจะซื้ออีก PunOko PunOko PunOko`
    )
  }
}

export const drawLotto = async (channel: string, misc: TwitchMisc) => {
  const dataRaw = await misc.redis?.hGet!('twitchBotStat', 'user-lotto')
  const countRaw = await misc.redis?.hGet!('twitchBotStat', 'user-lotto-count')
  if (!dataRaw) return
  const data: Record<string, Record<string, any>> = JSON.parse(dataRaw)
  const count = Number(countRaw)

  let drawNumber: string
  let totalIncome = count * 5
  let minPrize = 5
  let finalPrize = 0
  const tax = 0.2

  const lottoCount = Object.keys(data).length
  if (lottoCount > 1) {
    const random = Math.floor(Math.random() * lottoCount)
    drawNumber = Object.keys(data)[random]
  } else {
    drawNumber = Object.keys(data)[0]
    while (drawNumber === Object.keys(data)[0]) {
      drawNumber = Math.floor(Math.random() * 99).toString()
    }
  }

  if (count > 5) minPrize = 10
  totalIncome = totalIncome * (1 - tax) + Math.random() * 5

  const winner = data[drawNumber] || []
  const totalWinner = winner
    .map((v: Record<string, number>) => v.count)
    .reduce((a: number, b: number) => a + b, 0)
  if (totalWinner > 0)
    finalPrize = Math.max(Math.floor(totalIncome / totalWinner), minPrize)

  const winnerCount = winner.length
  const payout = totalWinner * finalPrize

  winner.forEach(async (winnerData: Record<string, any>) => {
    await prisma.userInfo.update({
      where: { twitchId: winnerData.twitchId },
      data: { coin: { increment: count * finalPrize } }
    })
  })

  await misc.sendMessage!(
    channel,
    `ประกาศผลรางวัล SniffsLotto เลขที่ออก ${drawNumber} sniffsAH มีผู้ชนะทั้งหมด ${winnerCount} คน ได้รับรางวัลรวม ${payout} sniffscoin sniffsHeart`
  )
  if (winnerCount > 0 && winnerCount <= 5) {
    let announce = 'ผู้โชคดีได้แก่ '
    winner.forEach((v: Record<string, number>, i: number) => {
      if (i === 0) {
        announce += `${v.twitchName}`
      } else if (i === winnerCount - 1) {
        announce += ` และ ${v.twitchName}`
      } else {
        announce += `, ${v.twitchName}`
      }
    })
    announce += ' คร่า sniffsHeart sniffsHeart sniffsHeart'
    await misc.sendMessage!(channel, announce)
  }

  const message = {
    winNumber: drawNumber,
    payout,
    usernames: winner
      .map((v: Record<string, number>) => ({
        [v.twitchName]: v.count * finalPrize
      }))
      .reduce((prev: Record<string, number>, cur: Record<string, number>) => {
        return Object.assign(prev, cur)
      }, {})
  }
  const payload = {
    type: 'drawLottoFeed',
    message,
    timeout: 30000
  }
  misc.pubMessage!('webfeed', 'feedmessage', JSON.stringify(payload))
  misc.pubMessage!('webfeed', 'lottodraw', JSON.stringify(message))

  await misc.redis?.hDel!('twitchBotStat', 'user-lotto')
  await misc.redis?.hSet!('twitchBotStat', 'user-lotto-count', 0)
}
