import axios from 'axios'
import express from 'express'
import xmlparser from 'express-xml-bodyparser'
import { createClient } from 'redis'
import prisma from '../backend/Prisma'
import { REST } from '@discordjs/rest'
import { OAuth2Routes, Routes } from 'discord-api-types/v9'
import { sendYTNotify } from './youtubehook'
import { logger } from '../logger'
import type { YTFeed } from './youtubehook'

const clientId = process.env.DISCORD_CLIENT_ID || ''
const clientSecret = process.env.DISCORD_CLIENT_SECRET || ''
const callbackUrl = process.env.TWITCH_CALLBACK_URL || ''
const redisURL = process.env.REDIS_URL || 'redis://localhost:6379'

const redisClient = createClient({ url: redisURL })
redisClient.connect().catch(console.error)

export const app = express()

app.get('/ytsub', ({ query: { 'hub.challenge': challenge } }, res) => {
  logger.verbose(`[EXPRESS] Youtube PubSub challenge is ${challenge}`)
  res.status(200).end(challenge)
})

app.post(
  '/ytsub',
  xmlparser({ trim: false, explicitArray: true }),
  (req, res) => {
    if (req.body) {
      const ytFeed: YTFeed[] = req.body.feed.entry
      if (ytFeed) {
        sendYTNotify(ytFeed)
      }
      res.status(204).end()
    } else {
      logger.error('[EXPRESS] Youtube PubSub request is empty')
      res.status(204).end()
    }
  }
)

app.get('/twitchlink', async (req, res) => {
  const code = String(req.query.code)
  const state = String(req.query.state)
  const discordId = String(req.query.state).slice(40)
  const stateCache = await redisClient.get(`${discordId}-state`)
  if (stateCache) {
    if (state === stateCache) {
      const params = new URLSearchParams()
      params.append('client_id', clientId)
      params.append('client_secret', clientSecret)
      params.append('grant_type', 'authorization_code')
      params.append('code', code)
      params.append('redirect_uri', callbackUrl)
      const response = await axios.post(OAuth2Routes.tokenURL, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        }
      })
      const authToken = response.data.access_token
      const rest = new REST({ version: '9' }).setToken(authToken)
      const connections = await rest.get(Routes.userConnections(), {
        authPrefix: 'Bearer'
      })
      const twitchData = (connections as Record<string, any>[]).find(
        (connection) => connection.type === 'twitch'
      )
      if (twitchData) {
        const twitchName = twitchData.name.toLowerCase()
        const response = await prisma.userInfo.upsert({
          create: {
            discordId,
            twitchName
          },
          update: {
            discordId
          },
          where: {
            twitchName
          }
        })
        if (response) {
          logger.verbose(`[EXPRESS] Twitch link success for ${twitchName}`)
          res.send(
            '<p>Succesfully connect your twitch account to SniffsBot<br>You can now close this windows</p>'
          )
        } else {
          logger.error(
            `[EXPRESS] Twitch link failed for ${twitchName} (dbError: No response)`
          )
          res
            .status(503)
            .send('<p>Please try again later (dbError: code 2)</p>')
        }
      } else {
        logger.verbose(
          `[EXPRESS] Twtch link failed for ${discordId} (No twitch connection)`
        )
        res.send('<p>There is no Twitch connection in your Discord ID')
      }
    } else {
      logger.warn(
        `[EXPRESS] Twitch link failed for ${discordId} (redis: State mismatch)`
      )
      res.status(403).send('<p>Invalid State Token</p>')
    }
  } else {
    logger.error(
      `[EXPRESS] Twitch link failed for ${discordId} (redis: No state)`
    )
    res.status(503).send('<p>Please try again later (dbError: code 1)</p>')
  }
})
