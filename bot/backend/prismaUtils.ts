import { twitchApiClient } from '../index'
import prisma from './Prisma'

export const upsertUser = async (
  twitchName: string,
  twitchId: string,
  subMonth: number
) => {
  const response = await prisma.userInfo.findUnique({
    select: { twitchId: true },
    where: { twitchName }
  })
  if (!response || response?.twitchId) {
    return await prisma.userInfo.upsert({
      create: {
        twitchName,
        twitchId,
        subMonth
      },
      update: {
        twitchName,
        subMonth
      },
      where: {
        twitchId
      }
    })
  } else {
    return await prisma.userInfo.upsert({
      create: {
        twitchName,
        twitchId,
        subMonth
      },
      update: {
        twitchId,
        subMonth
      },
      where: {
        twitchName
      }
    })
  }
}

export const getCoin = async (twitchName: string): Promise<number> => {
  const response = await prisma.userInfo.findUnique({
    select: { coin: true },
    where: { twitchName }
  })
  if (response) {
    return Number(response.coin)
  }
  return 0
}

export const bulkCoin = async (
  channel: string,
  coinAmount: number
): Promise<number> => {
  const chatterList = (
    await twitchApiClient.unsupported.getChatters(channel.slice(1))
  ).allChatters
  const chatterWithId = await twitchApiClient.users.getUsersByNames(chatterList)

  // upsert user
  await prisma.userInfo.createMany({
    data: chatterWithId.map((v) => ({ twitchId: v.id, twitchName: v.name })),
    skipDuplicates: true
  })
  // add coin
  await prisma.userInfo.updateMany({
    data: {
      coin: {
        increment: coinAmount
      }
    },
    where: {
      twitchId: { in: chatterWithId.map((v) => v.id) }
    }
  })
  return chatterList.length
}
