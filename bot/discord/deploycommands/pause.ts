import { SlashCommandBuilder } from '@discordjs/builders'
import { ExtendsInteraction } from '../lib/MessageEmbed'

module.exports = {
  data: new SlashCommandBuilder().setName('pause').setDescription('Pause Song'),
  async execute(_interaction: ExtendsInteraction): Promise<void> {}
}
