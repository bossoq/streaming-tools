import prisma from './Prisma'

export const upsertUser = async (twitchId: string, twitchName: string) => {
  await prisma.userInfo.upsert({
    create: {
      twitchId,
      twitchName
    },
    update: {
      twitchName
    },
    where: {
      twitchId
    }
  })
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
