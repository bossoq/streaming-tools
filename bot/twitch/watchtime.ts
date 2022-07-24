import prisma from '../backend/Prisma'
import { twitchApiClient } from '../index'
import { upsertUser } from '../backend/prismaUtils'
import type { watchTimeData, TwitchMisc } from './types'
import type { userInfo } from '@prisma/client'

export const updateWatchTime = async (
  user: string,
  status: 'join' | 'part' | 'update',
  misc: TwitchMisc
) => {
  const liveStatus =
    (await misc.redis?.hGet!('twitchBotStat', 'isLive')) === 'true'
  const liveDate = Number(await misc.redis?.hGet!('twitchBotStat', 'startDate'))
  const now = new Date().getTime()
  let userJoinPart: watchTimeData | undefined
  let resp: userInfo | undefined
  const userTag = await twitchApiClient.users.getUserByName(user.toLowerCase())
  if (!userTag) return

  await upsertUser(user.toLowerCase(), userTag.id)

  const userJoinPartRaw = await misc.redis?.hGet!('user-join-part', userTag.id)
  if (userJoinPartRaw) userJoinPart = JSON.parse(userJoinPartRaw)

  if (status === 'update') {
    if (!userJoinPart) return

    if (userJoinPart.status === 'join') {
      if (liveStatus) {
        const lastJoin = Number(userJoinPart.lastJoin)

        const watchTimeSession = Math.floor(
          (now - Math.max(lastJoin, liveDate)) / 1000
        )

        resp = await prisma.userInfo.update({
          where: { twitchId: userTag.id },
          data: { watchTime: { increment: watchTimeSession } }
        })
        userJoinPart.lastJoin = now
        if (resp) await redeemPoint(resp)
        await misc.redis?.hSet!(
          'user-join-part',
          userTag.id,
          JSON.stringify(userJoinPart)
        )
      }
    }
    return
  }

  if (userJoinPart) {
    if (status === 'join') {
      if (userJoinPart.status === 'join') {
        if (!liveStatus) {
          userJoinPart.lastJoin = now
        }
      } else if (userJoinPart.status === 'part') {
        userJoinPart.status = 'join'
        userJoinPart.lastJoin = now
      }
    } else if (status === 'part') {
      if (liveStatus) {
        const lastJoin = Number(userJoinPart.lastJoin)

        const watchTimeSession = Math.floor(
          (now - Math.max(lastJoin, liveDate)) / 1000
        )

        resp = await prisma.userInfo.update({
          where: { twitchId: userTag.id },
          data: { watchTime: { increment: watchTimeSession } }
        })
      }
      userJoinPart.status = 'part'
      userJoinPart.lastJoin = now
    }
  } else {
    userJoinPart = {
      status,
      lastJoin: now
    }
    if (status === 'part') {
      if (liveStatus) {
        const watchTimeSession = Math.floor((now - liveDate) / 1000)

        resp = await prisma.userInfo.update({
          where: { twitchId: userTag.id },
          data: { watchTime: { increment: watchTimeSession } }
        })
      }
    }
  }

  if (resp) await redeemPoint(resp)
  await misc.redis?.hSet!(
    'user-join-part',
    userTag.id,
    JSON.stringify(userJoinPart)
  )
}

const redeemPoint = async (userData: userInfo) => {
  const watchTimeToPoint = 30
  const pointToRedeem = 1

  const watchTime = Number(userData.watchTime)
  const watchTimeRedeem = Number(userData.watchTimeRedeem)

  const watchTimeToRedeem =
    Math.floor((watchTime - watchTimeRedeem) / watchTimeToPoint) *
    watchTimeToPoint
  const pointToAdd =
    Math.floor(watchTimeToRedeem / watchTimeToPoint) * pointToRedeem

  if (pointToAdd > 0) {
    if (userData.twitchId) {
      await prisma.userInfo.update({
        where: { twitchId: userData.twitchId },
        data: {
          watchTimeRedeem: {
            increment: watchTimeToRedeem
          },
          coin: {
            increment: pointToAdd
          }
        }
      })
    } else {
      await prisma.userInfo.update({
        where: { twitchName: userData.twitchName! },
        data: {
          watchTimeRedeem: {
            increment: watchTimeToRedeem
          },
          coin: {
            increment: pointToAdd
          }
        }
      })
    }
  }
}
