import { MawaConfiguration } from '../sdk/config.ts'
import { logger } from './log.ts'
import { resolve } from 'https://deno.land/std@0.170.0/path/mod.ts'

let configuration: MawaConfiguration
const configurationWatchers: (() => void | Promise<void>)[] = []

const loadConfiguration = async (configFile: string, terminateIfError = false) => {
    try {
        logger.debug('Loading configuration file', configFile)

        const config = await import(`file:///${configFile}?${Date.now()}`)
        configuration = config.default

        logger.debug('Configuration loaded', configuration)

        configurationWatchers.forEach((watcher) => watcher())
    } catch (err) {
        logger.error(err, 'Error loading configuration file')
        if (terminateIfError) {
            Deno.exit(1)
        }
    }
}

const initializeConfigurationChangesWatcher = async (configFile: string) => {
    const watcher = Deno.watchFs(configFile)
    for await (const event of watcher) {
        if (event.kind === 'modify') {
            logger.info('Configuration file changed, reloading...')
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

export const initializeConfiguration = async (directory: string, watchForChanges: boolean) => {
    const configFile = resolve(directory + '/mawa.config.ts')
    await loadConfiguration(configFile, true)

    if (watchForChanges) {
        // Cannot await this function, otherwise the server will never start
        initializeConfigurationChangesWatcher(configFile)
    }
}

export const config = () => configuration
