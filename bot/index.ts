import dotenvFlow from 'dotenv-flow'
dotenvFlow.config()

import { DiscordClient } from './discord/discord'
import { Player } from './discord/lib/Player'

export const discordClient = new DiscordClient()
export const player = new Player()
