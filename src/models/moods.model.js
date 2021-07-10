const config = require('../../knexfile')
const knex = require('knex')(config)

/**
 * Orders mood results can be returned in
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
     * Name alphabetically, ascending
     */
    NAME_ASC: 2,
    /**
     * Name alphabetically, descending
     */
    NAME_DESC: 3
}

/* Utility functions */
function moodInfo() {
    return knex('moods')
        .select('moods.id')
        .select(knex.ref('mood_name').as('name'))
        .select(knex.ref('mood_key').as('key'))
        .select(knex.ref('mood_character').as('character'))
        .select(knex.ref('char_name').as('character_name'))
        .select(knex.ref('mood_creator').as('creator'))
        .select(knex.ref('user_username').as('creator_username'))
        .select(knex.ref('mood_created_on').as('created_on'))
        .leftJoin('moodchars', 'mood_character', 'moodchars.id')
        .leftJoin('users', 'mood_creator', 'users.id')
}
/**
 * @param {Array<Object>} rows 
 */
function processMoodInfoRows(rows) {
    for(row of rows) {
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
        return '`moods`.`mood_created_on` DESC'
    case Order.TITLE_ASC:
        return '`moods`.`mood_name` ASC'
    case Order.TITLE_DESC:
        return '`moods`.`mood_name` DESC'
    default:
        return '`moods`.`mood_created_on` ASC'
    }
}

/**
 * Creates a new mood entry
 * @param {string} name The name
 * @param {string} key The key of the underlying file on disk
 * @param {number} character The ID of the character this mood belongs to
 * @param {number} creator The creator's ID
 */
async function createMood(name, key, character, creator) {
    return await knex('moods')
        .insert({
            mood_name: name,
            mood_key: key,
            mood_character: character,
            mood_creator: creator
        })
}

/**
 * Fetches the mood's info with the specified ID
 * @param {number} id The ID
 * @return {Array<Object>} An array with the row containing the mood's info or an empty array if none exists
 */
async function fetchMoodInfoById(id) {
    return processMoodInfoRows(
        await moodInfo()
            .where('moods.id', id)
    )
}

/**
 * Fetches the mood's info with the specified key
 * @param {number} key The key
 * @return {Array<Object>} An array with the row containing the mood's info or an empty array if none exists
 */
async function fetchMoodInfoByKey(key) {
    return processMoodInfoRows(
        await moodInfo()
            .where('mood_key', key)
    )
}

/**
 * Fetches all moods' info
 * @param {number} offset The offset to return results
 * @param {number} limit The amount of results to return
 * @param {number} order The order of results to return
 * @return {Array<Object>} All moods' info
 */
async function fetchMoodInfos(offset, limit, order) {
    return processMoodInfoRows(
        await moodInfo()
            .offset(offset)
            .limit(limit)
            .orderByRaw(orderBy(order))
    )
}

/**
 * Fetches all moods' info with the specified character
 * @param {number} character The character ID
 * @param {number} offset The offset to return results
 * @param {number} limit The amount of results to return
 * @param {number} order The order of results to return
 * @return {Array<Object>} All moods' info
 */
async function fetchMoodInfosByCharacter(character, offset, limit, order) {
    return processMoodInfoRows(
        await moodInfo()
            .where('mood_character', character)
            .offset(offset)
            .limit(limit)
            .orderByRaw(orderBy(order))
    )
}

/**
 * Fetches the amount of moods
 * @returns {number} The amount of moods
 */
async function fetchMoodsCount() {
    return (await knex('moods').count('*', { as: 'count' }))[0].count
}

/**
 * Deletes the mood with the specified ID
 * @param {number} id The mood ID
 */
async function deleteMoodById(id) {
    return await knex('moods')
        .del()
        .where('moods.id', id)
}

/**
 * Deletes all moods with the specified character
 * @param {number} character The character ID
 */
async function deleteMoodsByCharacter(character) {
    return await knex('moods')
        .del()
        .where('mood_character', character)
}

/* Export functions */
module.exports.createMood = createMood
module.exports.fetchMoodInfoById = fetchMoodInfoById
module.exports.fetchMoodInfoByKey = fetchMoodInfoByKey
module.exports.fetchMoodInfos = fetchMoodInfos
module.exports.fetchMoodInfosByCharacter = fetchMoodInfosByCharacter
module.exports.fetchMoodsCount = fetchMoodsCount
module.exports.deleteMoodById = deleteMoodById
module.exports.deleteMoodsByCharacter = deleteMoodsByCharacter

/* Export values */
module.exports.Order = Order