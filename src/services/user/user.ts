import { User, UserId } from '../../../sdk/user.ts'
import { config } from '../../config.ts'
import { userMemoryStorage } from './memory.ts'
import { userMongoDbStorage } from './mongodb.ts'

export const mergeUser = async (userId: UserId, user: Omit<User, 'id'>): Promise<User> => {
    const type = config().storage.type
    if (type === 'mongodb') {
        return await userMongoDbStorage.mergeUser(userId, user)
    } else if (type === 'memory') {
        return await userMemoryStorage.mergeUser(userId, user)
    } else {
        throw new Error(`Unknown storage type: ${type}`)
    }
}

export const getUser = async (id: UserId): Promise<User | undefined> => {
    const type = config().storage.type
    if (type === 'mongodb') {
        return await userMongoDbStorage.getUser(id)
    } else if (type === 'memory') {
        return await userMemoryStorage.getUser(id)
    } else {
        throw new Error(`Unknown storage type: ${type}`)
    }
}

export const getIdFromSourceId = (sourceUserId: string, sourceId: string): UserId => {
    return `${sourceId}:${encodeURIComponent(sourceUserId)}`
}
