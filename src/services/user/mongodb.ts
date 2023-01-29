import { User, UserId } from '../../../sdk/user.ts'
import { Document, ObjectId } from 'https://deno.land/x/mongo@v0.31.1/mod.ts'
import { getCollection } from '../mongodb.ts'

type UserSchema = User & {
    _id: ObjectId
    createdAt: Date
    updatedAt: Date
}

const mergeUser = async (userId: UserId, properties: Partial<Omit<User, 'id'>>): Promise<User> => {
    const collection = await getCollection<UserSchema>('users')
    const entity = (await collection.findAndModify(
        { id: userId },
        {
            update: {
                $set: {
                    ...properties,
                    metadata: {
                        $mergeObjects: ['$metadata', properties.metadata],
                    },
                    updatedAt: new Date(),
                } as Document,
                $setOnInsert: {
                    createdAt: new Date(),
                } as Document,
            },
            new: true,
            upsert: true,
        },
    )) as UserSchema

    const user: Partial<User> & { _id?: ObjectId } = { ...entity }
    delete user._id

    return User.build(user)
}

const getUser = async (id: UserId): Promise<User | undefined> => {
    const collection = await getCollection<UserSchema>('users')
    const entity = await collection.findOne({ id })

    const user: (Partial<User> & { _id?: ObjectId }) | undefined = entity && { ...entity }
    if (user) {
        delete user._id
    }

    return user && User.build(user)
}

export const userMongoDbStorage = {
    mergeUser,
    getUser,
}
