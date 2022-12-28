import { User, UserId } from '../../../sdk/user.ts'

const users: Record<string, User> = {}

const mergeUser = (userId: UserId, user: Omit<User, 'id'>): Promise<User> => {
    if (!users[userId]) {
        users[userId] = { ...user, id: userId, metadata: {} }
    } else {
        users[userId] = {
            ...users[userId],
            ...user,
            metadata: {
                ...users[userId].metadata,
                ...user.metadata,
            },
            id: userId,
        }
    }

    return Promise.resolve(users[userId])
}

const getUser = (id: UserId): Promise<User | undefined> => {
    return Promise.resolve(users[id])
}

export const userMemoryStorage = {
    mergeUser,
    getUser,
}
