import prisma from './Prisma'

export const upsertUser = async (userId: string, userName: string) => {
  await prisma.userInfoDev.upsert({
    create: {
      userId,
      userName
    },
    update: {
      userName
    },
    where: {
      userId
    }
  })
}

export const getCoin = async (userName: string): Promise<number> => {
  const response = await prisma.userInfoDev.findUnique({
    select: { coin: true },
    where: { userName }
  })
  if (response) {
    return Number(response.coin)
  }
  return 0
}
