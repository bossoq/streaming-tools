import { SlashCommandBuilder } from '@discordjs/builders'
import { ExtendsInteraction } from '../lib/MessageEmbed'

module.exports = {
  data: new SlashCommandBuilder().setName('skip').setDescription('Skip Song'),
  async execute(_interaction: ExtendsInteraction): Promise<void> {}
}
