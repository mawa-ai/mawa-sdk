import { config, setConfiguration, logger, Configuration } from '../mod.ts'
import { resolve } from 'https://deno.land/std@0.170.0/path/mod.ts'

const configurationWatchers: ((configuration: Configuration) => void | Promise<void>)[] = []

const loadConfiguration = async (configFile: string, terminateIfError = false) => {
    try {
        logger.debug('Loading configuration file', configFile)

        const config = await import(`file:///${configFile}?${Date.now()}`)
        const configuration = config.default

        setConfiguration(configuration)
        configurationWatchers.forEach((watcher) => watcher(configuration))

        logger.debug('Configuration loaded', configuration)
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

export const onConfigurationsLoaded = (callback: (typeof configurationWatchers)[0]) => {
    const configuration = config()
    if (configuration) {
        callback(configuration)
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

    const plugins = config().plugins ?? []
    await Promise.all(
        plugins.map(async (plugin) => {
            try {
                if (plugin.initialize) {
                    await plugin.initialize()
                }
            } catch (err) {
                logger.error(err, `Error initializing plugin ${plugin.id}`)
                throw err
            }
        }),
    )
}
