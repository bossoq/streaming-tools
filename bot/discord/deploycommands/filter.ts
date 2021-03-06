import { SlashCommandBuilder } from '@discordjs/builders'
import { ExtendsInteraction } from '../lib/MessageEmbed'

module.exports = {
  data: new SlashCommandBuilder()
    .setName('filter')
    .setDescription('Switch filter on/off'),
  async execute(_interaction: ExtendsInteraction): Promise<void> {}
}
