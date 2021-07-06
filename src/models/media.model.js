const config = require('../../knexfile')
const knex = require('knex')(config)
const utils = require('../utils/misc.util')

/**
 * Orders media results can be returned in
 */
const Order = {
    /**
     * Creation time, ascending
     */
    CREATED_ASC: 0,
    /**
     * Creation time, descending
     */
    CREATED_DESC: 1,
    /**
     * Title alphabetically, ascending
     */
    TITLE_ASC: 2,
    /**
     * Title alphabetically, descending
     */
    TITLE_DESC: 3,
    /**
     * Filename alphabetically, ascending
     */
    FILENAME_ASC: 4,
    /**
     * Filename alphabetically, descending
     */
    FILENAME_DESC: 5,
    /**
     * File size, ascending
     */
    SIZE_ASC: 6,
    /**
     * File size, descending
     */
    SIZE_DESC: 7
}

/* Utility functions */
function mediaInfo() {
    let query = knex('media')
        .select('media.id')
        .select(knex.ref('media_uploader').as('uploader'))
        .select(knex.ref('user_username').as('uploader_username'))
        .select(knex.ref('media_title').as('title'))
        .select(knex.ref('media_filename').as('filename'))
        .select(knex.ref('media_mime').as('mime'))
        .select(knex.ref('media_key').as('key'))
        .select(knex.ref('media_tags').as('tags'))
        .select(knex.ref('media_booru_visible').as('booru_visible'))
        .select(knex.ref('media_thumbnail_key').as('thumbnail_key'))
        .select(knex.ref('media_size').as('size'))
        .select(knex.ref('media_hash').as('hash'))
        .select(knex.ref('media_comment').as('comment'))
        .select(knex.ref('media_created_on').as('created_on'))
        .leftJoin('users', 'media_uploader', 'users.id')
    
    return query
}
/**
 * @param {Array<Object>} rows 
 */
function processMediaInfoRows(rows) {
    for(row of rows) {
        row.tags = utils.setToArray(row.tags)
        row.created_on = new Date(row.created_on)
    }
    return rows
}
/**
 * @param {number} order 
 * @returns {string}
 */
function orderBy(order) {
    switch(order) {
    case Order.CREATED_DESC:
        return '`media`.`media_created_on` DESC'
    case Order.TITLE_ASC:
        return '`media`.`media_title` ASC'
    case Order.TITLE_DESC:
        return '`media`.`media_title` DESC'
    case Order.FILENAME_ASC:
        return '`media`.`media_filename` ASC'
    case Order.FILENAME_DESC:
        return '`media`.`media_filename` DESC'
    case Order.SIZE_ASC:
        return '`media`.`media_size` ASC'
    case Order.SIZE_DESC:
        return '`media`.`media_size` DESC'
    default:
        return '`media`.`media_created_on` ASC'
    }
}

/**
 * Creates a new media entry
 * @param {number} uploader The uploader's ID
 * @param {string} title The media's title
 * @param {string} filename The media's display filename
 * @param {string} mime The media's MIME type
 * @param {string} key The key of the underlying file on disk
 * @param {Array<string>} tags The media tags
 * @param {boolean} booruVisible Whether the media is visible on the booru
 * @param {string?} thumbnailKey The key of the underlying thumbnail file on disk (null if no thumbnail)
 * @param {number} size The file's size in bytes
 * @param {string} hash The file's hash
 * @param {string?} comment The file's comemnt (can be null)
 */
async function createMedia(uploader, title, filename, mime, key, tags, booruVisible, thumbnailKey, size, hash, comment) {
    return await knex('media')
        .insert({
            media_uploader: uploader,
            media_title: title,
            media_filename: filename,
            media_mime: mime,
            media_key: key,
            media_tags: utils.arrayToSet(tags),
            media_booru_visible: booruVisible,
            media_thumbnail_key: thumbnailKey,
            media_size: size,
            media_hash: hash,
            media_comment: comment
        })
}

/**
 * Fetches all media
 * @param {number} offset The offset to return results
 * @param {number} limit The amount of results to return
 * @param {number} order The order of results to return
 * @return {Array<Object>} All media
 */
async function fetchMedia(offset, limit, order) {
    return await knex('media')
        .select('*')
        .offset(offset)
        .limit(limit)
        .orderByRaw(orderBy(order))
}

/**
 * Fetches info about all media
 * @param {number} offset The offset to return results
 * @param {number} limit The amount of results to return
 * @param {number} order The order of results to return
 * @returns {Array<Object>} All media's info
 */
async function fetchMediaInfos(offset, limit, order) {
    return processMediaInfoRows(
        await mediaInfo()
            .offset(offset)
            .limit(limit)
            .orderByRaw(orderBy(order))
    )
}

/**
 * Fetches media by its ID
 * @param {number} id The ID
 * @returns {Array<Object>} An array with the row containing the media or an empty array if none exists
 */
async function fetchMediaById(id) {
    return await knex('media')
        .select('*')
        .where('media.id', id)
}

/**
 * Fetches media info by its ID
 * @param {number} id The ID
 * @returns {Array<Object>} An array with the row containing the media info or an empty array if none exists
 */
async function fetchMediaInfoById(id) {
    return processMediaInfoRows(
        await mediaInfo()
            .where('media.id', id)
    )
}

/**
 * Fetches media infos by their IDs
 * @param {Array<number>} ids The IDs
 * @returns {Array<Object>} All media infos with the specified IDs
 */
async function fetchMediaInfosByIds(ids) {
    return processMediaInfoRows(
        await mediaInfo()
            .whereIn('media.id', ids)
    )
}

/**
 * Fetches booru-visible media infos by their IDs
 * @param {Array<number>} ids The IDs
 * @returns {Array<Object>} All booru-visible media infos with the specified IDs
 */
 async function fetchBooruVisibleMediaInfosByIds(ids) {
    return processMediaInfoRows(
        await mediaInfo()
            .whereIn('media.id', ids)
            .andWhere('media_booru_visible', true)
    )
}

/**
 * Fetches a media file by its hash
 * @param {string} hash The hash to search for
 * @returns {Array<Object>} An array with the row containing the media or an empty array if none exists
 */
async function fetchMediaByHash(hash) {
    return await knex('media')
        .select('*')
        .where('media_hash', hash)
}

/**
 * Returns the total amount of media
 * @returns {number} The total amount of media
 */
async function fetchMediaCount() {
    return (await knex('media').count('*', { as: 'count' }))[0].count
}

/**
 * Returns the total amount of booru-visible media
 * @returns {number} The total amount of booru-visible media
 */
async function fetchBooruVisibleMediaCount() {
    return (await knex('media')
        .count('*', { as: 'count' })
        .where('media_booru_visible', true))[0].count
}

/**
 * Returns the amount of booru-visible media uploaded by the specified uploader
 * @param {string} username The uploader's username
 * @returns {number} The amount of booru-visible media uploaded by the specified uploader
 */
 async function fetchBooruVisibleMediaCountByUploaderUsername(username) {
    return (await knex('media')
        .count('*', { as: 'count' })
        .where('media_booru_visible', true)
        .andWhere(knex.raw('LOWER(`user_username`)'), username.toLowerCase())
        .leftJoin('users', 'media_uploader', 'users.id'))[0].count
}

/**
 * Updates the media entry with the specified ID
 * @param {number} id The ID of the media to update
 * @param {string} title The new title
 * @param {Array<string>} tags The new tags
 * @param {boolean} booruVisible Whether it will be visible on the booru
 * @param {string?} comment The new comment (can be null)
 */
async function updateMediaById(id, title, tags, booruVisible, comment) {
    return await knex('media')
        .update({
            media_title: title,
            media_tags: utils.arrayToSet(tags),
            media_booru_visible: booruVisible,
            media_comment: comment
        })
        .where('id', id)
}

/**
 * Deletes the media entry with the specified ID, if it exists
 * @param {number} id The ID
 */
async function deleteMediaById(id) {
    return await knex('media')
        .del()
        .where('media.id', id)
}

/* Export functions */
module.exports.createMedia = createMedia
module.exports.fetchMedia = fetchMedia
module.exports.fetchMediaInfos = fetchMediaInfos
module.exports.fetchMediaById = fetchMediaById
module.exports.fetchMediaInfoById = fetchMediaInfoById
module.exports.fetchMediaInfosByIds = fetchMediaInfosByIds
module.exports.fetchBooruVisibleMediaInfosByIds = fetchBooruVisibleMediaInfosByIds
module.exports.fetchMediaByHash = fetchMediaByHash
module.exports.fetchMediaCount = fetchMediaCount
module.exports.fetchBooruVisibleMediaCount = fetchBooruVisibleMediaCount
module.exports.fetchBooruVisibleMediaCountByUploaderUsername = fetchBooruVisibleMediaCountByUploaderUsername
module.exports.updateMediaById = updateMediaById
module.exports.deleteMediaById = deleteMediaById

/* Export values */
module.exports.Order = Order