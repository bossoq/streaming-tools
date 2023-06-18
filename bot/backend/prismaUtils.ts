import { twitchApiClient } from '../index'
import prisma from './Prisma'

const twitchBotNick = 'bosssoq'

export const upsertUser = async (
  twitchName: string,
  twitchId: string,
  subMonth?: number
) => {
  const response = await prisma.userInfo.findUnique({
    select: { twitchId: true },
    where: { twitchName }
  })
  if (!response || response?.twitchId) {
    if (subMonth) {
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
          twitchId
        },
        update: {
          twitchName
        },
        where: {
          twitchId
        }
      })
    }
  } else {
    if (subMonth) {
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
  // const maxSize = 100
  const paginatedChatters = await twitchApiClient.chat.getChatters(
    (await twitchApiClient.users.getUserByName(channel.slice(1)))?.id || '',
    (await twitchApiClient.users.getUserByName(twitchBotNick))?.id || '',
    { limit: 1000 }
  )
  const chatterList = paginatedChatters.data
  // const chatterList = (
  //   await twitchApiClient.unsupported.getChatters(channel.slice(1))
  // ).allChatters

  const usersData: { twitchId: string; twitchName: string }[] = []
  for (const chatter of chatterList) {
    usersData.push({
      twitchId: chatter.userId,
      twitchName: chatter.userName
    })
  }
  // for (let i = 0; i < chatterList.length; i += maxSize) {
  //   const allUsersData = await twitchApiClient.users.getUsersByNames(
  //     chatterList.slice(i, i + maxSize)
  //   )
  //   allUsersData.map(async (user) => {
  //     usersData.push({
  //       twitchId: user.id,
  //       twitchName: user.name
  //     })
  //   })
  // }

  // upsert user
  await prisma.userInfo.createMany({
    data: usersData,
    // data: chatterList.map((v) => ({ twitchName: v })),
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
      twitchName: { in: chatterList.map((v) => v.userName) }
    }
  })
  return paginatedChatters.total
}
