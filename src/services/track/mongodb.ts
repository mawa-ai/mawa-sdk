import { ObjectId } from 'https://deno.land/x/mongo@v0.31.1/mod.ts'
import { UserId } from '../../../sdk/user.ts'
import { getCollection } from '../mongodb.ts'

type EventTrackingSchema = {
    _id: ObjectId
    userId: UserId
    event: string
    properties?: Record<string, unknown>
    createdAt: Date
}

const track = async (userId: UserId, event: string, properties?: Record<string, unknown>): Promise<void> => {
    const collection = await getCollection<EventTrackingSchema>('events')
    await collection.insertOne({
        userId,
        event,
        properties,
        createdAt: new Date(),
    })
}

export const trackMongoDbStorage = {
    track,
}
