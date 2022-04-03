import { player } from '../index'
import type { SelectMenuInteraction } from 'discord.js'

export const playMusic = (
  interaction: SelectMenuInteraction,
  value: string
) => {
  player.play(interaction, value)
}
