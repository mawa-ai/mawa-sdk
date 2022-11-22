export type RawChannelConfiguration = {
    webhookUrl: string
    authorizationToken?: string
}

export type ChannelsConfiguration = {
    raw?: RawChannelConfiguration
}

export type BotConfiguration = Record<string, unknown>

export type MawaConfiguration = {
    port: number
    channels: ChannelsConfiguration
    config?: BotConfiguration
}
