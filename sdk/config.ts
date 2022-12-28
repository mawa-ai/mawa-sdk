export type RawChannelConfiguration = {
    webhookUrl: string
    authorizationToken?: string
}

export type WhatsappChannelConfiguration = {
    numberId: string
    token: string
    verifyToken: string
}

export type ChannelsConfiguration = {
    raw?: RawChannelConfiguration
    whatsapp?: WhatsappChannelConfiguration
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
    config?: BotConfiguration
}
