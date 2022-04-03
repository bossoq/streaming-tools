import {
  createClient,
  SupabaseClient,
  PostgrestResponse,
  PostgrestSingleResponse
} from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_KEY || ''
const table = process.env.TABLE || ''
const twitchTable = process.env.TWITCH_TABLE || ''

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey)

type QueryResponse = {
  User_Name: string
  Coin: number
  Watch_Time: number
  Sub_Month: number
  Create_Time: Date
  Update_Time: Date
}

type LeaderBoard = {
  User_Name: string
  Coin: number
}

type TwitchTable = {
  discordId?: string
  twitchId?: string
  state?: string
  code?: string
  authToken?: string
  refreshToken?: string
}

export const getCoin = async (
  username: string
): Promise<number | undefined> => {
  const { data: userInfo, error }: PostgrestSingleResponse<QueryResponse> =
    await supabase
      .from<QueryResponse>(table)
      .select('*')
      .eq('User_Name', username)
      .single()
  let coin: number
  if (userInfo) {
    coin = userInfo.Coin
    return coin
  } else {
    console.warn(error)
  }
}

export const insertCoin = async ({
  User_Name,
  Coin
}: {
  User_Name: string
  Coin: number
}): Promise<{ success: boolean }> => {
  const { data: response, error }: PostgrestResponse<QueryResponse> =
    await supabase.from<QueryResponse>(table).upsert({ User_Name, Coin })
  if (response) {
    return { success: true }
  } else {
    console.error(error)
    return { success: false }
  }
}

export const getLeader = async (limit: number): Promise<LeaderBoard[]> => {
  const { data: userInfos, error }: PostgrestResponse<QueryResponse> =
    await supabase
      .from<QueryResponse>(table)
      .select('*')
      .order('Coin', { ascending: false })
      .neq('User_Name', 'sniffs_bot')
      .neq('User_Name', 'sniffslive')
      .neq('User_Name', 'moobot')
      .neq('User_Name', 'anotherttvviewer')
      .neq('User_Name', 'commanderroot')
      .neq('User_Name', 'v_and_k')
      .neq('User_Name', 'virgoproz')
      .neq('User_Name', 'federicofeliny')
      .neq('User_Name', 'aten')
      .neq('User_Name', 'discord_for_streamers')
      .neq('User_Name', 'd1sc0rdforsmallstreamers')
      .limit(limit)
  const resp: LeaderBoard[] = []
  if (userInfos) {
    userInfos.map(({ User_Name, Coin }) => {
      resp.push({ User_Name, Coin })
    })
  } else {
    console.warn(error)
  }
  return resp
}

export const queryTwitch = async (
  discordId: string | undefined
): Promise<TwitchTable | undefined> => {
  if (!discordId) return
  const { data: response, error }: PostgrestSingleResponse<TwitchTable> =
    await supabase
      .from<TwitchTable>(twitchTable)
      .select('*')
      .eq('discordId', discordId ? discordId : '*')
      .single()
  if (response) {
    return response
  } else {
    console.error(error)
    return
  }
}

export const insertTwitch = async (
  payload: TwitchTable
): Promise<{ success: boolean; userData?: TwitchTable }> => {
  const { data: userData, error }: PostgrestResponse<TwitchTable> =
    await supabase.from<TwitchTable>(twitchTable).upsert(payload)
  if (userData) {
    return { success: true, ...userData }
  } else {
    console.error(error)
    return { success: false }
  }
}
