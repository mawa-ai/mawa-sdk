import { isMessage, UnknownMessage } from '../../../sdk/message.ts'
import { Gateway, MessageHandler } from '../gateway.ts'
import { config } from '../../config.ts'
import { WebChannelConfiguration } from '../../../sdk/config.ts'
import { getKv, setKv } from '../../services/vars/vars.ts'
import { User } from '../../../sdk/user.ts'

export class WebGateway implements Gateway {
    public readonly sourceId = 'web'

    private readonly activeConnections = new Map<string, UnknownMessage[]>()

    public async receive(request: Request): Promise<Response | void> {
        const url = new URL(request.url)
        const customAction = url.searchParams.get('action')

        if (request.method === 'OPTIONS') {
            return new Response(undefined, { headers: this.getCorsHeaders(request, true) })
        } else if (request.method === 'GET' && customAction === 'auth') {
            if (
                this.config.authorizationToken &&
                this.config.authorizationToken !== request.headers.get('Authorization')
            ) {
                return new Response('Unauthorized', { status: 401, headers: this.getCorsHeaders(request) })
            }

            const sourceId = crypto.randomUUID()
            const userId = User.getIdFromSourceId(sourceId, this.sourceId)
            const password = crypto.randomUUID()

            await setKv(userId, '#web-password', password)
            return Response.json(
                {
                    user: sourceId,
                    password: password,
                },
                { headers: this.getCorsHeaders(request) },
            )
        }
    }

    public async handle(request: Request, onMessage: MessageHandler): Promise<Response> {
        const auth = request.headers.get('Authorization')
        if (!auth) {
            return new Response('Unauthorized', { status: 401, headers: this.getCorsHeaders(request) })
        }

        const [type, token] = auth.split(' ')
        if (type !== 'Basic') {
            return new Response('Unauthorized', { status: 401, headers: this.getCorsHeaders(request) })
        }

        const [sourceId, password] = atob(token).split(':')
        const userId = User.getIdFromSourceId(sourceId, this.sourceId)
        const storedPassword = await getKv(userId, '#web-password')
        if (password !== storedPassword) {
            return new Response('Unauthorized', { status: 401, headers: this.getCorsHeaders(request) })
        }

        this.activeConnections.set(sourceId, [])

        try {
            const message = await request.json()
            if (!isMessage(message)) {
                return new Response('Invalid message', { status: 400, headers: this.getCorsHeaders(request) })
            }

            await onMessage(sourceId, message, this)
            return Response.json(this.activeConnections.get(sourceId), { headers: this.getCorsHeaders(request) })
        } finally {
            this.activeConnections.delete(sourceId)
        }
    }

    public send(sourceUserId: string, message: UnknownMessage): Promise<void> {
        const messages = this.activeConnections.get(sourceUserId)
        if (messages) {
            messages.push(message)
        }
        return Promise.resolve()
    }

    private getCorsHeaders(request: Request, preflight = false): Headers {
        const headers = new Headers()

        const origin = request.headers.get('Origin')
        if (!origin && !preflight) {
            return headers
        }

        if (origin && this.config.allowedOrigins) {
            for (const allowedOrigin of this.config.allowedOrigins) {
                if (
                    (typeof allowedOrigin === 'string' && allowedOrigin === origin) ||
                    (allowedOrigin instanceof RegExp && allowedOrigin.test(origin))
                ) {
                    headers.set('Access-Control-Allow-Origin', origin)
                    break
                }
            }
        } else {
            headers.set('Access-Control-Allow-Origin', '*')
        }

        if (preflight) {
            headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
            headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        }

        return headers
    }

    private get config(): WebChannelConfiguration {
        return config().channels.web!
    }
}
