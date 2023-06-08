import { User, UserId } from './user.ts'

export interface Storage {
    track(userId: UserId, event: string, properties?: Record<string, unknown>): Promise<void>
    mergeUser(userId: UserId, user: Partial<Omit<User, 'id'>>): Promise<User>
    getUser(id: UserId): Promise<User | undefined>
    setKv<T>(userId: UserId, key: string, value: T): Promise<void>
    getKv<T>(userId: UserId, key: string): Promise<T | undefined>
}
