import dotenvFlow from 'dotenv-flow'
dotenvFlow.config()

import fs from 'fs'
import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9'
import { SlashCommandBuilder } from '@discordjs/builders'
import { BaseCommandInteraction } from 'discord.js'

const clientId = process.env.DISCORD_CLIENT_ID || ''
const guildId = process.env.DEV_GUILD_ID || ''
const token = process.env.DISCORD_TOKEN || ''

interface Command {
  data: SlashCommandBuilder
  execute(interaction: BaseCommandInteraction): Promise<void>
}

const commands: Record<string, any>[] = []
const commandFiles: string[] = fs
  .readdirSync('./discord/deploycommands')
  .filter((file) => file.endsWith('.ts'))

for (const file of commandFiles) {
  const command: Command = require(`./deploycommands/${file}`)
  commands.push(command.data.toJSON())
}

const rest = new REST({ version: '9' }).setToken(token)

;(async () => {
  try {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commands
    })
    console.log('Successfully registered application commands.')
  } catch (error) {
    console.error(error)
  }
})()
