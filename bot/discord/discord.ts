import fs from 'fs'
import {
  Client,
  Collection,
  Intents,
  Interaction,
  TextChannel
} from 'discord.js'
import { playMusic } from './playerhelper'
import { logger } from '../logger'
import type { SlashCommandBuilder } from '@discordjs/builders'
import type { SendEmbed } from './lib/MessageEmbed'

declare module 'discord.js' {
  interface Client {
    commands: Collection<string, Command>
  }
  interface Command extends NodeModule {
    data: SlashCommandBuilder
    execute(interaction: CommandInteraction): Promise<any>
  }
  interface TextWithEmbed extends TextChannel {
    send(
      options: string | MessagePayload | MessageOptions | SendEmbed
    ): Promise<Message>
  }
}

export class DiscordClient {
  client: Client

  constructor() {
    this.client = new Client({
      intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_MESSAGE_TYPING,
        Intents.FLAGS.GUILD_VOICE_STATES
      ]
    })
    this.client.commands = new Collection()
    const commandFiles = fs
      .readdirSync('./discord/commands')
      .filter((file) => file.endsWith('.ts'))
    for (const file of commandFiles) {
      const command = require(`./commands/${file}`)
      this.client.commands.set(command.data.name, command)
    }

    this.client.once('ready', () => {
      logger.info(`[DISCORD] Logged in as ${this.client.user!.tag}!`)
      setInterval(() => {
        const servers = this.client.guilds.cache.size
        const servercount = this.client.guilds.cache.reduce(
          (a, b) => a + b.memberCount,
          0
        )
        const activities = [
          `${servers} servers`,
          `looking ${servercount} members`,
          `uwu I'm stinky`,
          `Watching twitch.tv/sniffslive`
        ]
        const status = activities[Math.floor(Math.random() * activities.length)]
        this.client!.user!.setPresence({ activities: [{ name: `${status}` }] })
      }, 5000)
    })
    this.client.on('interactionCreate', async (interaction: Interaction) => {
      if (interaction.isCommand()) {
        const command = this.client.commands.get(interaction.commandName)
        if (!command) return
        try {
          await command.execute(interaction)
        } catch (error) {
          logger.error(`[DISCORD] Interaction error: ${error}`)
          await interaction.reply({
            content: 'There was an error while executing this command!',
            ephemeral: true
          })
        }
      } else if (interaction.isSelectMenu()) {
        if (interaction.customId === 'searchresult') {
          interaction.update({
            content: 'Song selected',
            components: [],
            embeds: []
          })
          playMusic(interaction, interaction.values[0])
        }
      } else {
        return
      }
    })
    this.client.login(process.env.DISCORD_TOKEN)
  }

  sendMessage = async (
    channelId: string,
    message: string | SendEmbed
  ): Promise<void> => {
    const guild = this.client.guilds.cache.find(
      (guild) => guild.id === process.env.DEV_GUILD_ID
    )

    if (!guild) {
      logger.warn(`[DISCORD] Guild not found: ${process.env.DEV_GUILD_ID}`)
      return
    }

    const channel: TextChannel = guild.channels.cache.find(
      (channel) => channel.id === channelId
    ) as TextChannel

    if (!channel) {
      logger.warn(`[DISCORD] Channel not found: ${channelId}`)
      return
    }

    await channel.send(message)
  }
}
