export interface QueryResponse {
  userName: string
  coin: number
  watchTime: number
  subMonth: number
  creationTime: Date
  updateTime: Date
}

export interface LeaderBoard {
  userName: string
  coin: number
}

export interface TwitchTable {
  discordId?: string
  twitchId?: string
  state?: string
  code?: string
  authToken?: string
  refreshToken?: string
}

export interface State extends Map<string, unknown> {
  channelLive: boolean
  channelLiveOn: Date
  feedEnable: boolean
  songFeedEnable: boolean
  marketOpen: boolean
  lottoOpen: boolean
  raffleOpen: boolean
  songRequestStatus: boolean
  vipList: string[]
}
