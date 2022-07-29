import { twitchApiClient } from '../index'
import { upsertUser } from './prismaUtils'
import prisma from './Prisma'
import { logger } from '../logger'

const queryNullId = async (): Promise<string[]> => {
  const response = await prisma.userInfo.findMany({
    select: { twitchName: true },
    where: { twitchId: null }
  })
  const allUsers: string[] = []
  response.map((user) => {
    if (user.twitchName) allUsers.push(user.twitchName)
  })
  logger.verbose(`[CRONJOB] Found ${allUsers.length} users with null id`)
  return allUsers
}

const upsertUserId = async (twitchName: string[]) => {
  if (twitchName.length) {
    const maxSize = 100
    for (let i = 0; i < twitchName.length; i += maxSize) {
      const allUsersData = await twitchApiClient.users.getUsersByNames(
        twitchName.slice(i, i + maxSize)
      )
      allUsersData.map(async (user) => {
        logger.verbose(`[CRONJOB] Upserting ${user.name} with ${user.id}`)
        try {
          await upsertUser(user.name, user.id)
        } catch (e) {
          logger.error(
            `[CRONJOB] Error upserting ${user.name} with ${user.id} (reason: ${e})`
          )
          await handleDupId(user.name, user.id)
        }
      })
    }
  }
}

const handleDupId = async (twitchName: string, twitchId: string) => {
  const userByName = await prisma.userInfo.findUnique({
    where: { twitchName }
  })
  if (!userByName) return
  const userById = await prisma.userInfo.findUnique({
    where: { twitchId }
  })
  if (!userById) return

  const totalCoin = Number(userByName.coin) + Number(userById.coin)
  const totalWatchTime =
    Number(userByName.watchTime) + Number(userById.watchTime)
  const totalWatchTimeRedeem =
    Number(userByName.watchTimeRedeem) + Number(userById.watchTimeRedeem)

  await prisma.userInfo.delete({
    where: { twitchName }
  })
  await prisma.userInfo.update({
    where: { twitchId },
    data: {
      twitchName,
      coin: totalCoin,
      watchTime: totalWatchTime,
      watchTimeRedeem: totalWatchTimeRedeem
    }
  })
  logger.verbose(`[CRONJOB] Merged ${twitchName} with ${twitchId}`)
}

const deleteNullId = async () => {
  const response = await prisma.userInfo.deleteMany({
    where: { twitchId: null }
  })
  logger.verbose(`[CRONJOB] Deleted ${response.count} users`)
}

export const maintainDatabase = async () => {
  logger.info('[CRONJOB] Maintaining database')
  const twitchName = await queryNullId()
  if (twitchName.length) {
    await upsertUserId(twitchName)
    await deleteNullId()
  }
}
