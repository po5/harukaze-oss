import fs from 'fs'
import { unlink, readdir } from 'fs/promises'
import util from 'util'
import { sanitizePath } from './misc.util'
const exists = util.promisify(fs.exists)

/**
 * Logos path prefix
 */
const prefix = 'media/logos/'

/**
 * Returns all logo paths
 * @returns All logo paths
 */
export async function getLogoPaths(): Promise<string[]> {
    const fnames = await getLogoNames()
    const paths = new Array(fnames.length)
    for(let i in fnames)
        paths[i] = prefix+fnames[i]
    return paths
}

/**
 * Returns all logo filenames
 * @returns All logo filenames
 */
export async function getLogoNames(): Promise<string[]> {
    return await readdir(prefix)
}

/**
 * Returns the path for the logo with the specified filename
 * @param filename The filename
 * @returns The path for the logo with the specified filename or null if it could not be found
 */
export async function getLogoPathByName(filename: string): Promise<string | null> {
    const fname = sanitizePath(filename)
    if(await exists(prefix+fname))
        return prefix+fname
    else
        return null
}

/**
 * Deletes the logo with the specified filename if it exists
 * @param filename The filename
 */
export async function deleteLogoByName(filename: string) {
    const fname = sanitizePath(filename)
    if(await exists(prefix+fname))
        await unlink(prefix+fname)
}