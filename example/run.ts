import { readLines } from 'https://deno.land/std@0.165.0/io/buffer.ts'

Deno.run({
    cwd: './src',
    cmd: ['deno', 'run', '--allow-all', '../../src/index.ts'],
    stdout: 'piped',
})

const sendMessage = async (message: string) => {
    await fetch('http://localhost:3000/raw', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: 'console',
            message: {
                type: 'text',
                content: message,
            },
        }),
    })
}

const handlerHttpConnection = async (conn: Deno.Conn) => {
    const httpConn = Deno.serveHttp(conn)
    for await (const requestEvent of httpConn) {
        const {
            message: { content },
        } = await requestEvent.request.json()
        console.log(`Bot: ${content}`)
        requestEvent.respondWith(new Response())
    }
}

const startServer = async () => {
    const server = Deno.listen({ port: 3001 })
    for await (const conn of server) {
        handlerHttpConnection(conn)
    }
}

startServer()

Deno.stdout.writeSync(new TextEncoder().encode('You: '))
for await (const line of readLines(Deno.stdin)) {
    await sendMessage(line)
    Deno.stdout.writeSync(new TextEncoder().encode('You: '))
}
