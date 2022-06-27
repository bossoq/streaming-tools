import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction } from 'discord.js'

type LinkName = {
  name: string
  link: string
}

const mainRepo: LinkName = {
  name: 'streaming-tools',
  link: 'https://github.com/bossoq/streaming-tools'
}
const webfeedRepo: LinkName = {
  name: 'SniffsbotWebfeed',
  link: 'https://github.com/bossoq/SniffsbotWebfeed'
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('github')
    .setDescription('Retrieve Github Link!'),
  async execute(interaction: CommandInteraction): Promise<void> {
    interaction.reply({
      content: `Streaming-tools (Twitch+Discord): [${mainRepo.name}](${mainRepo.link})\nWebfeed Repo: [${webfeedRepo.name}](${webfeedRepo.link})`,
      embeds: [],
      ephemeral: true
    })
  }
}
