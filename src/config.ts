import { MawaConfiguration } from '../sdk/config.ts'

let configuration: MawaConfiguration

const initializeConfigurationChangesWatcher = async (configFile: string) => {
    const watcher = Deno.watchFs(configFile)
    for await (const event of watcher) {
        if (event.kind === 'modify') {
            console.log('Configuration file changed, reloading...')

            const config = await import(`${configFile}?${Date.now()}`)
            configuration = config.default
        }
    }
}

export const initializeConfiguration = async (directory: string) => {
    const configFile = directory + '/mawa.config.ts'
    try {
        const config = await import(configFile)
        configuration = config.default
    } catch (err) {
        console.error('Error loading configuration file:', err)
        Deno.exit(1)
    }

    // Cannot await this function, otherwise the server will never start
    initializeConfigurationChangesWatcher(configFile)
}

export const config = () => configuration
