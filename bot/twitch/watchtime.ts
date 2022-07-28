import prisma from '../backend/Prisma'
import { twitchApiClient } from '../index'
import { upsertUser } from '../backend/prismaUtils'
import { logger } from '../logger'
import type { watchTimeData, TwitchMisc } from './types'
import type { userInfo } from '@prisma/client'

export const updateWatchTime = async (
  channel: string,
  user: string,
  status: 'join' | 'part' | 'update',
  misc: TwitchMisc
) => {
  const liveStatus =
    (await misc.redis?.hGet!('twitchBotStat', 'isLive')) === 'true'
  const liveDate = Number(await misc.redis?.hGet!('twitchBotStat', 'startDate'))
  const now = new Date().getTime()
  const nowString = new Date(now).toISOString()
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
        logger.verbose(
          `[TWITCH] ${channel} ${user} update lastJoin to ${nowString}`
        )
        logger.verbose(
          `[TWITCH] ${channel} ${user} watchTimeSession ${watchTimeSession} (Total ${resp.watchTime})`
        )
        if (resp) await redeemPoint(channel, resp)
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
          logger.verbose(
            `[TWITCH] ${channel} ${user} update lastJoin to ${nowString}`
          )
        }
      } else if (userJoinPart.status === 'part') {
        userJoinPart.status = 'join'
        userJoinPart.lastJoin = now
        logger.verbose(
          `[TWITCH] ${channel} ${user} update lastJoin to ${nowString} and change status to join`
        )
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
        logger.verbose(
          `[TWITCH] ${channel} ${user} watchTimeSession ${watchTimeSession} (Total ${resp.watchTime})`
        )
      }
      userJoinPart.status = 'part'
      userJoinPart.lastJoin = now
      logger.verbose(
        `[TWITCH] ${channel} ${user} update lastJoin to ${nowString} and change status to part`
      )
    }
  } else {
    userJoinPart = {
      status,
      lastJoin: now
    }
    logger.verbose(
      `[TWITCH] ${channel} ${user} add lastJoin to ${nowString} and add status to ${status}`
    )
    if (status === 'part') {
      if (liveStatus) {
        const watchTimeSession = Math.floor((now - liveDate) / 1000)

        resp = await prisma.userInfo.update({
          where: { twitchId: userTag.id },
          data: { watchTime: { increment: watchTimeSession } }
        })
        logger.verbose(
          `[TWITCH] ${channel} ${user} watchTimeSession ${watchTimeSession} (Total ${resp.watchTime})`
        )
      }
    }
  }

  if (resp) await redeemPoint(channel, resp)
  await misc.redis?.hSet!(
    'user-join-part',
    userTag.id,
    JSON.stringify(userJoinPart)
  )
}

export const forceUpdateWatchTime = async (
  channel: string,
  misc: TwitchMisc
) => {
  const liveStatus =
    (await misc.redis?.hGet!('twitchBotStat', 'isLive')) === 'true'
  const liveDate = Number(await misc.redis?.hGet!('twitchBotStat', 'startDate'))
  const now = new Date().getTime()
  const nowString = new Date(now).toISOString()
  let userJoinPartAll: Map<string, watchTimeData> | undefined
  let resp: userInfo | undefined

  const userJoinPartAllRaw = await misc.redis?.hGetAll!('user-join-part')
  if (userJoinPartAllRaw) {
    userJoinPartAll = new Map()
    for (const key in userJoinPartAllRaw) {
      userJoinPartAll.set(key, JSON.parse(userJoinPartAllRaw[key]))
    }
    userJoinPartAll.forEach(async (userJoinPart, userId) => {
      if (userJoinPart.status === 'join') {
        if (liveStatus) {
          const lastJoin = Number(userJoinPart.lastJoin)

          const watchTimeSession = Math.floor(
            (now - Math.max(lastJoin, liveDate)) / 1000
          )

          userJoinPart.lastJoin = now
          resp = await prisma.userInfo.update({
            where: { twitchId: userId },
            data: { watchTime: { increment: watchTimeSession } }
          })
          logger.verbose(
            `[TWITCH] ${channel} ${userId} update lastJoin to ${nowString}`
          )
          logger.verbose(
            `[TWITCH] ${channel} ${userId} watchTimeSession ${watchTimeSession} (Total ${resp.watchTime})`
          )
          if (resp) await redeemPoint(channel, resp)
          await misc.redis?.hSet!(
            'user-join-part',
            userId,
            JSON.stringify(userJoinPart)
          )
        }
      }
    })
  }
}

const redeemPoint = async (channel: string, userData: userInfo) => {
  const watchTimeToPoint = 60 * 60
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
    logger.info(
      `[TWITCH] ${channel} ${
        userData.twitchName ?? userData.twitchId
      } redeemed ${pointToAdd} coins`
    )
  }
}
