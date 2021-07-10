const mediaModel = require('../models/media.model')
const utils = require('./misc.util')

var _tags = []

/**
 * Refreshes all media tags in memory
 */
async function refreshTags() {
    // Fetch all tags
    let rows = await mediaModel.fetchMediaTags()

    // Enumerate and remove duplicates
    let tags = []
    for(row of rows) {
        let arr = utils.setToArray(row.tags)

        for(tag of arr)
            if(!tags.includes(tag))
                tags.push(tag)
    }

    // Sort by length
    tags.sort((a, b) => a.length - b.length)

    // Store tags
    _tags = tags
}

/**
 * Returns all media tags
 * @returns All media tags
 */
function getTags() {
    return _tags
}

/**
 * Returns all tags containing the provided substring
 * @param {string} substr The substring to check for
 * @returns All tags containing the provided substring
 */
function getTagsContaining(substr) {
    let str = substr.trim().toLowerCase()
    let tags = []
    for(tag of _tags)
        if(tag.includes(str))
            tags.push(tag)
    
    return tags
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