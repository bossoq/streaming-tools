import { CommandInteraction, MessageEmbed } from 'discord.js'

type Message = {
  name: string
  value: string
  inline?: boolean
}

export type SendEmbed = {
  content?: string
  embeds: MessageEmbed[]
  ephemeral?: boolean
}

export interface ExtendsInteraction extends CommandInteraction {
  reply(options: SendEmbed | any): Promise<void | any>
}

const footer: string =
  'Contribute @ github: https://github.com/bossoq/streaming-tools'
const footerImg: string =
  'https://teopwbuwkgtwnhmddsuj.supabase.in/storage/v1/object/public/sniffsbot-asset/images/GitHub-Mark-64px.png'

export const embedMessageBuilder = (messages: Message[]): MessageEmbed => {
  const embedMessage = new MessageEmbed().setFooter({
    text: footer,
    iconURL: footerImg
  })
  messages.forEach((message: Message) => {
    embedMessage.addField(message.name, message.value, message.inline)
  })
  embedMessage.setColor('#FF95C5')
  return embedMessage
}
