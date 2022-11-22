import { User, UserId } from '../../sdk/user.ts'

const users: Record<string, User> = {}

export const mergeUser = (userId: UserId, user: Omit<User, 'id'>): Promise<void> => {
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

    return Promise.resolve()
}

export const getUser = (id: string): Promise<User> => {
    return Promise.resolve(users[id])
}

export const getIdFromSourceId = (sourceUserId: string, sourceId: string): UserId => {
    return `${sourceId}:${encodeURIComponent(sourceUserId)}`
}
