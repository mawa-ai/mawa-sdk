export type UserId = `${string}:${string}`

export type User = {
    id: UserId
    name?: string
    phoneNumber?: string
    email?: string
    photoUri?: string
    metadata?: Record<string, string>
}
