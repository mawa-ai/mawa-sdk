export type UserId = `${string}:${string}`

export class User {
    public id: UserId
    public name?: string
    public phoneNumber?: string
    public email?: string
    public photoUri?: string
    public metadata?: Record<string, string>

    constructor(id: UserId) {
        this.id = id
    }

    public static build(user: Partial<User>): User {
        const { id } = user
        if (!id) {
            throw new Error('User id is required')
        }
        return Object.assign(new User(id), user)
    }
}
