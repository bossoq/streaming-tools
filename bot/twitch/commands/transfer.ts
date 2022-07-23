import prisma from '../../backend/Prisma'
import { twitchApiClient } from '../../index'
import { upsertUser } from '../../backend/prismaUtils'
import type { TwitchCommand } from '../types'

const transfer: TwitchCommand = {
  name: '!transfer',
  execute: async (_client, channel, _user, message, tag, misc) => {
    const taxRate = 0.1
    const [_, recipentNameArg, ...args] = message.split(/\s+/)
    if (!recipentNameArg) return

    let amount = 1

    if (args.length) {
      let group = args[0].match(/(-?\d+)/)
      if (group && group[1]) {
        amount = Number.parseInt(group[1])
      }
    }

    if (amount <= 0) return

    const recipentMatch = recipentNameArg.match(/^@?(\w+)$/)
    let recipentName: string
    if (recipentMatch && recipentMatch[1]) {
      recipentName = recipentMatch[1].toLowerCase()
    } else {
      return
    }

    const recipentTag = await twitchApiClient.users.getUserByName(recipentName)
    if (!recipentTag) return
    await upsertUser(recipentTag.name, recipentTag.id)

    const payerData = await prisma.userInfo.findUnique({
      select: { coin: true },
      where: { twitchId: tag.userInfo.userId }
    })
    if (
      payerData &&
      Number(payerData.coin) >= Math.ceil(amount * (1 + taxRate))
    ) {
      await prisma.userInfo.update({
        where: { twitchId: tag.userInfo.userId },
        data: { coin: { decrement: Math.ceil(amount * (1 + taxRate)) } }
      })
      await prisma.userInfo.update({
        where: { twitchId: recipentTag.id },
        data: { coin: { increment: amount } }
      })
      await misc?.sendMessage!(
        channel,
        `${tag.userInfo.displayName} โอนเหรียญให้ ${
          recipentTag.displayName
        } จำนวน ${amount} Sniffscoin สำเร็จค่าาา~~ (ค่าธรรมเนียม ${Math.ceil(
          amount * taxRate
        )} Sniffscoin)`
      )
    }
  }
}

export default transfer
