export type WebhookChannelConfiguration = {
    url: string
    authorizationToken?: string
}

export type WhatsappChannelConfiguration = {
    numberId: string
    token: string
    verifyToken: string
}

export type WebChannelConfiguration = {
    allowedOrigins?: string[]
    authorizationToken?: string
}

export type ChannelsConfiguration = {
    webhook?: WebhookChannelConfiguration
    whatsapp?: WhatsappChannelConfiguration
    web?: WebChannelConfiguration
}

export type BotConfiguration = Record<string, unknown>

export type MongoDbConfiguration = {
    url: string
    database: string
}

export type StorageConfiguration =
    | {
          type: 'memory'
      }
    | {
          type: 'mongodb'
          config: MongoDbConfiguration
      }

export type MawaConfiguration = {
    port: number
    channels: ChannelsConfiguration
    storage: StorageConfiguration
    logLevel?: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR'
    config?: BotConfiguration
}
