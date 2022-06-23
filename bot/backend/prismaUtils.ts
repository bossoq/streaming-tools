import { twitchApiClient } from '../index'
import prisma from './Prisma'

export const upsertUser = async (twitchName: string, twitchId: string) => {
  const response = await prisma.userInfo.findUnique({
    select: { twitchId: true },
    where: { twitchName }
  })
  if (!response || response?.twitchId) {
    return await prisma.userInfo.upsert({
      create: {
        twitchName,
        twitchId
      },
      update: {
        twitchName
      },
      where: {
        twitchId
      }
    })
  } else {
    return await prisma.userInfo.upsert({
      create: {
        twitchName,
        twitchId
      },
      update: {
        twitchId
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
