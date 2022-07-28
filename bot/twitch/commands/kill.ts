import prisma from '../../backend/Prisma'
import { twitchApiClient } from '../../index'
import { logger } from '../../logger'
import type { TwitchCommand } from '../types'

const kill: TwitchCommand = {
  name: '!kill',
  execute: async (_client, channel, _user, message, tag, misc) => {
    let override = false
    let payRate = 50
    let dodgeRate = 10
    const duration = Math.floor(Math.random() * 45) + 15
    const timestampNow = Date.now()
    const lastUsed = parseInt(
      (await misc?.redis?.hGet('!kill-cooldown', 'global')) || '0'
    )
    if (tag.userInfo.isBroadcaster || tag.userInfo.isMod) {
      override = true
      dodgeRate = 0
      payRate = 0
    }

    const available = timestampNow - lastUsed > 1200 * 1000

    const [_, targetNameArg] = message.split(/\s+/)
    if (!targetNameArg) {
      if (available)
        await misc?.sendMessage!(
          channel,
          'กรุณาระบุชื่อผู้ใช้ที่จะจ้างมือปืนสนิฟ'
        )
      logger.info(
        `[TWITCH] ${channel} ${tag.userInfo.displayName} failed to kill (no targetName)`
      )
      return
    }

    const targetMatch = targetNameArg.match(/^@?(\w+)$/)
    let targetName: string
    if (targetMatch && targetMatch[1]) {
      targetName = targetMatch[1].toLocaleLowerCase()
    } else {
      logger.info(
        `[TWITCH] ${channel} ${tag.userInfo.displayName} failed to kill ${targetNameArg} (regex failed)`
      )
      return
    }

    const chatterList = await twitchApiClient.unsupported.getChatters(
      channel.slice(1)
    )
    const allChatters = chatterList.allChatters
    if (!allChatters.includes(targetName) && targetName !== 'me') {
      logger.info(
        `[TWITCH] ${channel} ${tag.userInfo.displayName} failed to kill ${targetName} (not in channel)`
      )
      if (available)
        await misc?.sendMessage!(channel, `ไม่พบชื่อ ${targetName} ในสมรภูมินะ`)
      return
    }
    if (available || override) {
      const targetRole = chatterList.allChattersWithStatus.get(targetName)
      if (!targetRole && targetName !== 'me') {
        misc?.sendMessage!(
          channel,
          `มือปืนหาเป้าหมาย ${targetName} ไม่เจอ ลองยิงใหม่นะ`
        )
        logger.info(
          `[TWITCH] ${channel} ${tag.userInfo.displayName} failed to kill ${targetName} (cannot retrieve role)`
        )
        return
      }
      let shooterState = 'success'
      if (targetName === 'me') {
        if (override) return
        payRate = 10
        shooterState = 'me'
      }
      if (targetRole === 'broadcaster' || targetRole === 'moderators') {
        if (override) {
          misc?.sendMessage!(
            channel,
            `${tag.userInfo.displayName} กับ ${targetName} ไม่ตีกันเองสิ`
          )
          logger.info(
            `[TWITCH] ${channel} ${tag.userInfo.displayName} failed to kill ${targetName} (moderator/broadcaster)`
          )
          return
        } else {
          shooterState = 'vip'
        }
      }
      if (targetRole === 'vips') {
        if (!override && !tag.userInfo.isVip) {
          shooterState = 'vip'
        }
      }

      const employerData = await prisma.userInfo.findUnique({
        select: { coin: true },
        where: { twitchId: tag.userInfo.userId }
      })
      if (employerData && Number(employerData.coin) >= payRate) {
        await prisma.userInfo.update({
          where: { twitchId: tag.userInfo.userId },
          data: { coin: { decrement: payRate } }
        })
        if (shooterState === 'success') {
          let targetSub = 0
          const targetTag = await twitchApiClient.users.getUserByName(
            targetName
          )
          if (targetTag) {
            const targetData = await prisma.userInfo.findUnique({
              select: { subMonth: true },
              where: { twitchId: targetTag.id }
            })
            targetSub = Number(targetData?.subMonth) || 0
          }
          if (!override) dodgeRate += Math.min(targetSub * 1.5, 10)
          if (Math.random() < dodgeRate / 100) shooterState = 'dodge'
        }
      } else {
        if (shooterState === 'vip') {
          shooterState = 'vipNomoney'
        } else {
          shooterState = 'noMoney'
        }
      }

      let message: Record<string, any>
      let payload: Record<string, any>
      switch (shooterState) {
        case 'success':
          logger.info(
            `[TWITCH] ${channel} ${tag.userInfo.displayName} killed ${targetName} (${duration}s) (${dodgeRate}% dodge)`
          )
          if (!override)
            await misc?.redis?.hSet(
              '!kill-cooldown',
              'global',
              timestampNow.toString()
            )
          await misc?.timeout!(
            channel,
            targetName,
            duration,
            `${tag.userInfo.displayName} จ้างมือปืนสนิฟยิงปิ้วๆ ${duration} วินาที`
          )
          await misc?.sendFeedMessage!(
            channel,
            `${tag.userInfo.displayName} จ้างมือปืนสนิฟยิง ${targetName} ${duration} วินาที sniffsAH`
          )
          message = {
            username: tag.userInfo.displayName,
            target: targetName,
            timeout: duration,
            coinleft: Number(employerData?.coin) - payRate
          }
          payload = {
            type: 'shooterSuccessFeed',
            message,
            timeout: 10000
          }
          break
        case 'dodge':
          logger.info(
            `[TWITCH] ${channel} ${tag.userInfo.displayName} failed to kill ${targetName} (dodge) (${dodgeRate}% dodge)`
          )
          await misc?.sendFeedMessage!(
            channel,
            `${
              tag.userInfo.displayName
            } หลบมือปืนสนิฟได้ sniffsHeart ${targetName} เสียใจด้วยนะ (Dodge = ${Math.floor(
              dodgeRate
            )}%)`
          )
          message = {
            target: targetName,
            dodgeRate: dodgeRate
          }
          payload = {
            type: 'shooterDodgeFeed',
            message,
            timeout: 10000
          }
          break
        case 'vip':
          logger.info(
            `[TWITCH] ${channel} ${tag.userInfo.displayName} failed to kill ${targetName} (VIP)`
          )
          await misc?.timeout!(
            channel,
            tag.userInfo.userName,
            duration,
            `บังอาจเหิมเกริมหรอ นั่งพักไปก่อน ${duration} วินาที`
          )
          await misc?.sendFeedMessage!(
            channel,
            `${tag.userInfo.displayName} บังอาจนักนะ PunOko บินไปเองซะ ${duration} วินาที`
          )
          message = {
            username: tag.userInfo.displayName,
            timeout: duration
          }
          payload = {
            type: 'shooterVIPFeed',
            message,
            timeout: 10000
          }
          break
        case 'vipNomoney':
          logger.info(
            `[TWITCH] ${channel} ${tag.userInfo.displayName} failed to kill ${targetName} (VIP no money)`
          )
          await misc?.timeout!(
            channel,
            tag.userInfo.userName,
            duration * 2,
            `ไม่มีเงินจ้างแล้วยังเหิมเกริมอีก รับโทษ 2 เท่า (${Math.floor(
              duration * 2
            )} วินาที)`
          )
          await misc?.sendFeedMessage!(
            channel,
            `${
              tag.userInfo.displayName
            } ไม่มีเงินจ้างมือปืน ยังจะเหิมเกริม PunOko บินไปซะ ${Math.floor(
              duration * 2
            )} วินาที`
          )
          message = {
            username: tag.userInfo.displayName,
            timeout: duration * 2
          }
          payload = {
            type: 'shooterUnsuccessFeed',
            message,
            timeout: 10000
          }
          break
        case 'noMoney':
          logger.info(
            `[TWITCH] ${channel} ${tag.userInfo.displayName} failed to kill ${targetName} (no money)`
          )
          await misc?.timeout!(
            channel,
            tag.userInfo.userName,
            duration,
            `ไม่มีเงินจ้างมือปืนงั้นรึ โดนยิงเองซะ ${duration} วินาที`
          )
          await misc?.sendFeedMessage!(
            channel,
            `${tag.userInfo.displayName} ไม่มีเงินจ้างมือปืน PunOko โดนมือปืนยิงตาย ${duration} วินาที`
          )
          message = {
            username: tag.userInfo.displayName,
            timeout: duration
          }
          payload = {
            type: 'shooterUnsuccessFeed',
            message,
            timeout: 10000
          }
          break
        case 'me':
          logger.info(
            `[TWITCH] ${channel} ${tag.userInfo.displayName} suicide (${duration}s)`
          )
          await misc?.timeout!(
            channel,
            tag.userInfo.userName,
            duration,
            `อยากไปเยือนยมโลกหรอ สนิฟจัดให้ ${duration} วินาที`
          )
          await misc?.sendFeedMessage!(
            channel,
            `${tag.userInfo.displayName} แวะไปเยือนยมโลก ${duration} วินาที sniffsAH`
          )
          message = {
            username: tag.userInfo.displayName,
            timeout: duration
          }
          payload = {
            type: 'shooterSuicideFeed',
            message,
            timeout: 10000
          }
          break
        default:
          return
      }
      misc?.pubMessage!('webfeed', 'feedmessage', JSON.stringify(payload))
    }
  }
}

export default kill
