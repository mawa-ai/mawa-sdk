import { Channel } from './channel.ts'
import { Storage } from './storage.ts'

export type BotConfiguration = Record<string, unknown>

export type Configuration = {
    channels: Channel[]
    storage: Storage
    logLevel?: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR'
    config?: BotConfiguration
}

let currentConfiguration: Configuration
export const setConfiguration = (configuration: Configuration) => {
    currentConfiguration = configuration
}

export const config = () => currentConfiguration
