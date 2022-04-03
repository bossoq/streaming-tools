import { SlashCommandBuilder } from '@discordjs/builders'
import { player } from '../../index'
import { ExtendsInteraction } from '../lib/MessageEmbed'

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Clear Song Queue'),
  async execute(interaction: ExtendsInteraction): Promise<void> {
    player.clear(interaction)
  }
}
