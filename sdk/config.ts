export type HttpHostingConfiguration = {
    port: number
}

export type HostingConfiguration = {
    http?: HttpHostingConfiguration
}

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
    allowedOrigins?: (string | RegExp)[]
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
    hosting: HostingConfiguration
    channels: ChannelsConfiguration
    storage: StorageConfiguration
    logLevel?: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR'
    config?: BotConfiguration
}
