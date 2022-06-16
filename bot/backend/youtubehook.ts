import axios from 'axios'
import cron from 'node-cron'
import { URLSearchParams } from 'url'
import { discordClient } from '../index'
import { preparedYTNotify } from '../discord/lib/PreparedMessage'

export type VideosMeta = {
  id: string | null | undefined
  title: string | null | undefined
  description: string | null | undefined
  thumbnail: string | null | undefined
  live: string | null | undefined
  publishTime: Date
  channelId: string | null | undefined
  channelTitle: string | null | undefined
}

export interface YTFeed {
  id: string[]
  'yt:videoid': string[]
  'yt:channelid': string[]
  title: string[]
  link: {
    $: {
      rel: string
      href: string
    }
  }[]
  author: {
    name: string[]
    uri: string[]
  }[]
  published: string[]
  updated: string[]
}

const announceChannel = process.env.DISCORD_ANNOUNCE_CHANNEL || ''
const ytChannelId = process.env.YOUTUBE_CHANNEL_ID || ''
const ytCallbackUrl = process.env.YOUTUBE_CALLBACK_URL || ''

export const requestPubSub = async () => {
  const params = new URLSearchParams()
  params.append('hub.callback', ytCallbackUrl)
  params.append(
    'hub.topic',
    `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${ytChannelId}`
  )
  params.append('hub.verify', 'async')
  params.append('hub.mode', 'subscribe')
  params.append('hub.lease_seconds', String(60 * 60 * 24 * 10)) // expire in 10 days
  const response = await axios.post(
    'https://pubsubhubbub.appspot.com/subscribe',
    params,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      }
    }
  )
  if (response.status === 202) {
    console.log('Successfully Registered with PubSub service')
  } else {
    console.error('There is a problem registering with PubSub service')
    await requestPubSub()
  }
}

export const pubSubCron = cron.schedule('0 0 */10 * *', async () => {
  console.log('Refreshing PubSub')
  await requestPubSub()
})

export const sendYTNotify = async (ytFeed: YTFeed[]) => {
  try {
    const meta: VideosMeta = {
      id: ytFeed[0]['yt:videoid'][0],
      title: ytFeed[0].title[0],
      description: 'No Description',
      thumbnail: `https://i.ytimg.com/vi/${ytFeed[0]['yt:videoid'][0]}/hqdefault.jpg`,
      live: 'none',
      publishTime: new Date(ytFeed[0].published[0]),
      channelId: ytFeed[0]['yt:channelid'][0],
      channelTitle: ytFeed[0].author[0].name[0]
    }
    console.log(`Sending YT Notify for ${meta.title}`)
    await discordClient.sendMessage(announceChannel, preparedYTNotify(meta))
  } catch (error) {
    console.error(error)
  }
}
