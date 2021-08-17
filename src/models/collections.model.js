const config = require('../../knexfile')
const knex = require('knex')(config)

/**
 * Orders collection results can be returned in
 */
 const Order = {
    /**
     * Creation time, ascending
     */
    CREATED_ASC: 0,
    /**
     * Creation time, descending
     */
    CREATED_DESC: 1
}

/* Utility functions */
function collectionInfo() {
    return knex('collections')
        .select('collections.id')
        .select(knex.ref('collection_title').as('title'))
        .select(knex.ref('collection_comment').as('comment'))
        .select(knex.ref('collection_creator').as('creator'))
        .select(knex.ref('user_username').as('creator_username'))
        .select(knex.ref('collection_created_on').as('created_on'))
        .select(knex.raw(`(
            SELECT COUNT(*)
            FROM \`collectionitems\`
            WHERE \`item_collection\` = \`collections\`.\`id\`
        ) AS \`items\``))
        .select(knex.raw(`(
            SELECT item_media
            FROM \`collectionitems\`
            WHERE \`item_collection\` = \`collections\`.\`id\`
            ORDER BY \`item_created_on\` ASC
            LIMIT 1
        ) AS \`first_item\``))
        .leftJoin('users', 'collection_creator', 'users.id')
}
/**
 * @param {Array<Object>} rows 
 */
function processCollectionInfoRows(rows) {
    for(let row of rows) {
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
        return '`collections`.`collection_created_on` DESC'
    default:
        return '`collections`.`collection_created_on` ASC'
    }
}

/**
 * Creates a new collection
 * @param {string} title The collection title
 * @param {?string} comment The collection comment (can be null)
 * @param {number} creator The ID of the collection creator
 */
async function createCollection(title, comment, creator) {
    return knex('collections')
        .insert({
            collection_title: title,
            collection_comment: comment,
            collection_creator: creator
        })
}

/**
 * Creates a new collection item entry
 * @param {number} media The media ID
 * @param {number} collection The collection ID
 * @param {number} creator The ID of the user who added the item (not the user who created the media or collection)
 */
 async function createCollectionItem(media, collection, creator) {
    return knex('collectionitems')
        .insert({
            item_media: media,
            item_collection: collection,
            item_creator: creator
        })
}

/**
 * Fetches a collection's info by its ID
 * @param {number} id The ID
 * @returns {Promise<Array<Object>>} An array with the row containing the collection's info or an empty array if none exists
 */
 async function fetchCollectionInfoById(id) {
    return processCollectionInfoRows(
        await collectionInfo()
            .where('collections.id', id)
    )
}

/**
 * Fetches all collections' info
 * @param {number} offset The offset to return results
 * @param {number} limit The amount of results to return
 * @param {number} order The order of results to return
 * @returns {Promise<Array<Object>>} All collections' info
 */
 async function fetchCollectionInfos(offset, limit, order) {
    return processCollectionInfoRows(
        await collectionInfo()
            .offset(offset)
            .limit(limit)
            .orderByRaw(orderBy(order))
    )
}

/**
 * Fetches all collections' info by the specified creator
 * @param {number} creator The ID of the creator
 * @param {number} offset The offset to return results
 * @param {number} limit The amount of results to return
 * @param {number} order The order of results to return
 * @returns {Promise<Array<Object>>} All collections' info by the specified creator
 */
 async function fetchCollectionInfosByCreator(creator, offset, limit, order) {
    return processCollectionInfoRows(
        await collectionInfo()
            .where('collection_creator', creator)
            .offset(offset)
            .limit(limit)
            .orderByRaw(orderBy(order))
    )
}

/**
 * Fetches all collections' info that contain the specified media ID
 * @param {number} media The media ID
 * @param {number} offset The offset to return results
 * @param {number} limit The amount of results to return
 * @param {number} order The order of results to return
 * @returns {Promise<Array<Object>>} All collections' info that contain the specified media ID
 */
 async function fetchCollectionInfosWithMedia(media, offset, limit, order) {
    return processCollectionInfoRows(
        await collectionInfo()
            .whereRaw(`(
                SELECT COUNT(*) FROM \`collectionitems\`
                WHERE \`item_collection\` = \`collections\`.\`id\` AND \`item_media\` = ?
            ) > 0`, [media])
            .offset(offset)
            .limit(limit)
            .orderByRaw(orderBy(order))
    )
}

/**
 * Fetches all collections' info that do not contain the specified media ID
 * @param {number} media The media ID
 * @param {number} offset The offset to return results
 * @param {number} limit The amount of results to return
 * @param {number} order The order of results to return
 * @returns {Promise<Array<Object>>} All collections' info that do not contain the specified media ID
 */
 async function fetchCollectionInfosWithoutMedia(media, offset, limit, order) {
    return processCollectionInfoRows(
        await collectionInfo()
            .whereRaw(`(
                SELECT COUNT(*) FROM \`collectionitems\`
                WHERE \`item_collection\` = \`collections\`.\`id\` AND \`item_media\` = ?
            ) < 1`, [media])
            .offset(offset)
            .limit(limit)
            .orderByRaw(orderBy(order))
    )
}

/**
 * Returns the total amount of collections
 * @returns {Promise<number>} The total amount of collections
 */
async function fetchCollectionsCount() {
    return (await knex('collections').count('*', { as: 'count' }))[0].count
}

/**
 * Returns the total amount of collections by the specified creator
 * @param {number} creator The ID of the creator
 * @returns {Promise<number>} The total amount of collections by the specified creator
 */
async function fetchCollectionsCountByCreator(creator) {
    return (await knex('collections')
        .count('*', { as: 'count' })
        .where('collection_creator', creator)
    )[0].count
}

/**
 * Returns whether the specified media exists in the provided list
 * @param {number} media The media ID
 * @param {number} collection The collection ID
 * @returns {Promise<boolean>} Whether the specified media exists in the provided list
 */
async function fetchMediaExistsInCollection(media, collection) {
    return (await knex('collectionitems')
        .count('*', { as: 'count' })
        .where('item_media', media)
        .andWhere('item_collection', collection))[0].count > 0
}

/**
 * Deletes a collection by its ID
 * @param {number} id The ID
 */
async function deleteCollectionById(id) {
    return knex('collections')
        .del()
        .where('id', id)
}

/**
 * Deletes an item in the specified collection with the provided media ID
 * @param {number} media The media ID
 * @param {number} collection The collection ID
 */
async function deleteCollectionItemByMediaAndCollection(media, collection) {
    return knex('collectionitems')
        .del()
        .where('item_media', media)
        .andWhere('item_collection', collection)
}

/* Export functions */
module.exports.createCollection = createCollection
module.exports.createCollectionItem = createCollectionItem
module.exports.fetchCollectionInfoById = fetchCollectionInfoById
module.exports.fetchCollectionInfos = fetchCollectionInfos
module.exports.fetchCollectionInfosByCreator = fetchCollectionInfosByCreator
module.exports.fetchCollectionInfosWithMedia = fetchCollectionInfosWithMedia
module.exports.fetchCollectionInfosWithoutMedia = fetchCollectionInfosWithoutMedia
module.exports.fetchCollectionsCount = fetchCollectionsCount
module.exports.fetchCollectionsCountByCreator = fetchCollectionsCountByCreator
module.exports.fetchMediaExistsInCollection = fetchMediaExistsInCollection
module.exports.deleteCollectionById = deleteCollectionById
module.exports.deleteCollectionItemByMediaAndCollection = deleteCollectionItemByMediaAndCollection

/* Export values */
module.exports.Order = Order