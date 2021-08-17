const mediaModel = require('../models/media.model')
const utils = require('./misc.util')

let _tags = {}

/**
 * Refreshes all media tags in memory
 */
async function refreshTags() {
    // Fetch all tags
    let rows = await mediaModel.fetchMediaTags()

    // Enumerate and remove duplicates
    let tags = {}
    for(let row of rows) {
        let arr = utils.setToArray(row.tags)

        for(let tag of arr) {
            if(tag in tags)
                tags[tag]++
            else
                tags[tag] = 1
        }
    }

    // Sort by name length
    tags = Object.keys(tags).sort((a, b) => a.length - b.length).reduce((res, key) => (res[key] = tags[key], res), {})

    // Store tags
    _tags = tags
}

/**
 * Returns all media tags
 * @returns {Object} All media tags
 */
function getTags() {
    return _tags
}

/**
 * Returns all tags containing the provided substring
 * @param {string} substr The substring to check for
 * @returns {Object} All tags containing the provided substring
 */
function getTagsContaining(substr) {
    let str = substr.trim().toLowerCase()
    let tags = {}
    let tagNames = Object.keys(_tags)
    for(let tag of tagNames)
        if(tag.includes(str))
            tags[tag] = _tags[tag]
    
    return tags
}

/**
 * Returns the amount of uses a tag has
 * @param {string} tag The tag to check
 * @return {number} The amount of uses the specified tag has
 */
function getTagUseCount(tag) {
    return tag in _tags ? _tags[tag] : 0
}

// Refresh tags every minute
setInterval(async () => {
    try {
        await refreshTags()
    } catch(err) {
        console.error('FAILED TO REFRESH TAGS:')
        console.error(err)
    }
}, 60_000)

/* Export functions */
module.exports.refreshTags = refreshTags
module.exports.getTags = getTags
module.exports.getTagsContaining = getTagsContaining
module.exports.getTagUseCount = getTagUseCount