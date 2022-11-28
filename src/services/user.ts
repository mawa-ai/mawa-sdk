import { User, UserId } from '../../sdk/user.ts'
import { Document, ObjectId } from 'https://deno.land/x/mongo@v0.31.1/mod.ts'
import { getCollection } from './mongodb.ts'

type UserSchema = User & {
    _id: ObjectId
}

export const mergeUser = async (userId: UserId, user: Omit<User, 'id'>): Promise<void> => {
    const collection = await getCollection<UserSchema>('users')
    await collection.updateOne(
        { id: userId },
        {
            $set: {
                ...user,
                metadata: {
                    $mergeObjects: ['$user.metadata', user.metadata],
                },
            } as Document,
        },
        { upsert: true },
    )
}

export const getUser = async (id: UserId): Promise<User | undefined> => {
    const collection = await getCollection<UserSchema>('users')
    const entity = collection.findOne({ id })
    return entity && { ...entity, _id: undefined }
}

export const getIdFromSourceId = (sourceUserId: string, sourceId: string): UserId => {
    return `${sourceId}:${encodeURIComponent(sourceUserId)}`
}
