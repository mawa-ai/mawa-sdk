import { UserId, Storage, User, logger } from '../../mod.ts'

const users: Record<string, User> = {}
const vars: Record<string, Record<string, unknown>> = {}

export class MemoryStorage implements Storage {
    track(userId: UserId, event: string, properties?: Record<string, unknown> | undefined): Promise<void> {
        logger.info(`Tracking ~ ${event} (${userId})`, properties)
        return Promise.resolve()
    }

    mergeUser(userId: UserId, user: Partial<Omit<User, 'id'>>): Promise<User> {
        if (!users[userId]) {
            users[userId] = User.build({ ...user, id: userId, metadata: {} })
        } else {
            users[userId] = User.build({
                ...users[userId],
                ...user,
                metadata: {
                    ...users[userId].metadata,
                    ...user.metadata,
                },
                id: userId,
            })
        }

        return Promise.resolve(users[userId])
    }

    getUser(id: UserId): Promise<User | undefined> {
        return Promise.resolve(users[id])
    }

    setKv<T>(userId: UserId, key: string, value: T): Promise<void> {
        if (!vars[userId]) {
            vars[userId] = {}
        }
        vars[userId][key] = value
        return Promise.resolve()
    }

    getKv<T>(userId: UserId, key: string): Promise<T | undefined> {
        if (!vars[userId]) {
            return Promise.resolve(undefined)
        }
        return Promise.resolve(vars[userId][key] as T)
    }
}
