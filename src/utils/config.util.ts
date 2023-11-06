import config from '../../config.json'
import { join } from 'path'
import { writeFile } from 'fs/promises'
import { AppGlobal } from '../types/misc.types'

/**
 * Saves the config file in its current state
 */
export async function saveConfig() {
    // Write new config file
    let confPath = join((global as unknown as AppGlobal).root, '/config.json')
    await writeFile(confPath, JSON.stringify(config, null, 4))
}