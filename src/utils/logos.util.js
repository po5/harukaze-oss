const fs = require('fs')
const util = require('util')
const { stripTrailingSlash, sanitizePath } = require('./misc.util')
const unlink = util.promisify(fs.unlink)
const readdir = util.promisify(fs.readdir)
const exists = util.promisify(fs.exists)

const prefix = 'media/logos/'

/**
 * Returns all logo paths
 * @returns {Array<string>} All logo paths
 */
async function getLogoPaths() {
    let fnames = await getLogoNames()
    let paths = new Array(fnames.length)
    for(i in fnames)
        paths[i] = prefix+fnames[i]
    return paths
}

/**
 * Returns all logo filenames
 * @returns {Array<string>} All logo filenames
 */
async function getLogoNames() {
    return await readdir(prefix)
}

/**
 * Returns the path for the logo with the specified filename
 * @param {string} filename The filename
 * @returns The path for the logo with the specified filename
 */
async function getLogoPathByName(filename) {
    let fname = sanitizePath(filename)
    if(await exists(prefix+fname))
        return prefix+fname
    else
        return null
}

/**
 * Deletes the logo with the specified filename if it exists
 * @param {string} filename The filename
 */
async function deleteLogoByName(filename) {
    let fname = sanitizePath(filename)
    if(await exists(prefix+fname))
        await unlink(prefix+fname)
}

/* Export functions */
module.exports.getLogoPaths = getLogoPaths
module.exports.getLogoNames = getLogoNames
module.exports.getLogoPathByName = getLogoPathByName
module.exports.deleteLogoByName = deleteLogoByName