const mediaModel = require('../models/media.model')
const postsModel = require('../models/posts.model')
const utils = require('./misc.util')

let _mediaTags = {}
let _postTags = {}

/**
 * Refreshes all tags in memory
 */
async function refreshTags() {
    // Fetch all media tags
    let mediaRows = await mediaModel.fetchMediaTags()

    // Enumerate and remove duplicates
    let mediaTags = {}
    for(let row of mediaRows) {
        let arr = utils.setToArray(row.tags)

        for(let tag of arr) {
            if(tag in mediaTags)
                mediaTags[tag]++
            else
                mediaTags[tag] = 1
        }
    }

    // Sort by name length
    mediaTags = Object.keys(mediaTags).sort((a, b) => a.length - b.length).reduce((res, key) => (res[key] = mediaTags[key], res), {})

    // Store media tags
    _mediaTags = mediaTags

    // Fetch all post tags
    let postRows = await postsModel.fetchPostTags()

    // Enumerate and remove duplicates
    let postTags = {}
    for(let row of postRows) {
        let arr = utils.setToArray(row.tags)

        for(let tag of arr) {
            if(tag in postTags)
                postTags[tag]++
            else
                postTags[tag] = 1
        }
    }

    // Sort by name length
    postTags = Object.keys(postTags).sort((a, b) => a.length - b.length).reduce((res, key) => (res[key] = postTags[key], res), {})

    // Store post tags
    _postTags = postTags
}

/**
 * Returns all media tags
 * @returns {Object} All media tags
 */
function getMediaTags() {
    return _mediaTags
}

/**
 * Returns all media tags containing the provided substring
 * @param {string} substr The substring to check for
 * @returns {Object} All tags containing the provided substring
 */
function getMediaTagsContaining(substr) {
    let str = substr.trim().toLowerCase()
    let tags = {}
    let tagNames = Object.keys(_mediaTags)
    for(let tag of tagNames)
        if(tag.includes(str))
            tags[tag] = _mediaTags[tag]
    
    return tags
}

/**
 * Returns the amount of uses a media tag has
 * @param {string} tag The tag to check
 * @return {number} The amount of uses the specified tag has
 */
function getMediaTagUseCount(tag) {
    return tag in _mediaTags ? _mediaTags[tag] : 0
}

/**
 * Returns all post tags
 * @returns {Object} All post tags
 */
function getPostTags() {
    return _postTags
}

/**
 * Returns all post tags containing the provided substring
 * @param {string} substr The substring to check for
 * @returns {Object} All tags containing the provided substring
 */
function getPostTagsContaining(substr) {
    let str = substr.trim().toLowerCase()
    let tags = {}
    let tagNames = Object.keys(_postTags)
    for(let tag of tagNames)
        if(tag.includes(str))
            tags[tag] = _postTags[tag]

    return tags
}

/**
 * Returns the amount of uses a post tag has
 * @param {string} tag The tag to check
 * @return {number} The amount of uses the specified tag has
 */
function getPostTagUseCount(tag) {
    return tag in _postTags ? _postTags[tag] : 0
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
module.exports.getMediaTags = getMediaTags
module.exports.getMediaTagsContaining = getMediaTagsContaining
module.exports.getMediaTagUseCount = getMediaTagUseCount
module.exports.getPostTags = getPostTags
module.exports.getPostTagsContaining = getPostTagsContaining
module.exports.getPostTagUseCount = getPostTagUseCount