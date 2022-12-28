import { MawaConfiguration } from '../sdk/config.ts'

let configuration: MawaConfiguration
const configurationWatchers: (() => unknown)[] = []

const loadConfiguration = async (configFile: string, terminateIfError = false) => {
    try {
        const config = await import(`file:///${configFile}?${Date.now()}`)
        configuration = config.default

        configurationWatchers.forEach((watcher) => watcher())
    } catch (err) {
        console.error('Error loading configuration file:', err)
        if (terminateIfError) {
            Deno.exit(1)
        }
    }
}

const initializeConfigurationChangesWatcher = async (configFile: string) => {
    const watcher = Deno.watchFs(configFile)
    for await (const event of watcher) {
        if (event.kind === 'modify') {
            console.log('Configuration file changed, reloading...')
            await loadConfiguration(configFile)
        }
    }
}

export const onConfigurationsLoaded = (callback: typeof configurationWatchers[0]) => {
    if (configuration) {
        callback()
    }

    configurationWatchers.push(callback)
}

export const initializeConfiguration = async (directory: string) => {
    const configFile = directory + '/mawa.config.ts'
    await loadConfiguration(configFile, true)

    // Cannot await this function, otherwise the server will never start
    initializeConfigurationChangesWatcher(configFile)
}

export const config = () => configuration
