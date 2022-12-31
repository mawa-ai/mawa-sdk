import { ObjectId } from 'https://deno.land/x/mongo@v0.31.1/mod.ts'
import { UserId } from '../../../sdk/user.ts'
import { getCollection } from '../mongodb.ts'

type VariableSchema = {
    _id: ObjectId
    userId: UserId
    key: string
    value: unknown
    createdAt: Date
}

const setKv = async <T>(userId: UserId, key: string, value: T): Promise<void> => {
    const collection = await getCollection<VariableSchema>('variables')
    await collection.updateOne(
        { userId, key },
        {
            $set: {
                value: typeof value === 'undefined' ? null : value,
            },
            $setOnInsert: {
                createdAt: new Date(),
            },
        },
        { upsert: true },
    )
}

const getKv = async <T>(userId: UserId, key: string): Promise<T | undefined> => {
    const collection = await getCollection<VariableSchema>('variables')
    const entity = await collection.findOne({
        userId,
        key,
    })
    const value = entity && (entity.value as T)
    return value === null ? undefined : value
}

export const varsMongoDbStorage = {
    setKv,
    getKv,
}
