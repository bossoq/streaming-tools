import { SlashCommandBuilder } from '@discordjs/builders'
import { player } from '../../index'
import { ExtendsInteraction } from '../lib/MessageEmbed'

module.exports = {
  data: new SlashCommandBuilder().setName('pause').setDescription('Pause Song'),
  async execute(interaction: ExtendsInteraction): Promise<void> {
    player.pause(interaction)
  }
}
