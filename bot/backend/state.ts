import fs from 'node:fs'
import cron from 'node-cron'
import type { State } from './types'

class BotState {
  private filePath: string
  private state: State

  constructor() {
    this.filePath = './state.json'
    const data = fs.readFileSync(this.filePath, 'utf-8')
    this.state = new Map(Object.entries(JSON.parse(data))) as State
  }

  public async getState(key: string): Promise<unknown> {
    return this.state.get(key)
  }

  public async setState(key: string, value: unknown): Promise<void> {
    this.state.set(key, value)
  }

  public async writeStateFile(): Promise<void> {
    fs.writeFileSync(
      this.filePath,
      JSON.stringify(Object.fromEntries(this.state))
    )
  }
}

export const botState = new BotState()

export const syncStateFile = cron.schedule('5 * * * *', () => {
  botState.writeStateFile()
  console.log('Sync state file')
})
