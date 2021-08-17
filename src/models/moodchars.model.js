const config = require('../../knexfile')
const knex = require('knex')(config)

/**
 * Orders mood character results can be returned in
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
function charInfo() {
    return knex('moodchars')
        .select('moodchars.id')
        .select(knex.ref('char_name').as('name'))
        .select(knex.ref('char_default').as('default'))
        .select(knex.ref('char_creator').as('creator'))
        .select(knex.ref('user_username').as('creator_username'))
        .select(knex.ref('char_created_on').as('created_on'))
        .select(knex.raw(`(
            SELECT mood_name
            FROM \`moods\`
            WHERE \`moods\`.\`id\` = char_default
            LIMIT 1
        ) AS \`default_name\``))
        .select(knex.raw(`(
            SELECT COUNT(*)
            FROM \`moods\`
            WHERE \`mood_character\` = \`moodchars\`.\`id\`
        ) AS \`moods\``))
        .leftJoin('users', 'char_creator', 'users.id')
}
/**
 * @param {Array<Object>} rows 
 */
function processCharInfoRows(rows) {
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
        return '`moodchars`.`char_created_on` DESC'
    case Order.TITLE_ASC:
        return '`moodchars`.`char_name` ASC'
    case Order.TITLE_DESC:
        return '`moodchars`.`char_name` DESC'
    default:
        return '`moodchars`.`char_created_on` ASC'
    }
}

/**
 * Creates a new character
 * @param {string} name The name
 * @param {number} creator The creator's ID
 */
async function createCharacter(name, creator) {
    return knex('moodchars')
        .insert({
            char_name: name,
            char_creator: creator
        })
}

/**
 * Fetches the character's info with the specified ID
 * @param {number} id The ID
 * @return {Promise<Array<Object>>} An array with the row containing the character's info or an empty array if none exists
 */
async function fetchCharacterInfoById(id) {
    return processCharInfoRows(
        await charInfo()
            .where('moodchars.id', id)
    )
}

/**
 * Fetches all characters' info
 * @param {number} offset The offset to return results
 * @param {number} limit The amount of results to return
 * @param {number} order The order of results to return
 * @return {Promise<Array<Object>>} All characters' info
 */
async function fetchCharacterInfos(offset, limit, order) {
    return processCharInfoRows(
        await charInfo()
            .offset(offset)
            .limit(limit)
            .orderByRaw(orderBy(order))
    )
}

/**
 * Fetches all characters' info with a default mood
 * @param {number} offset The offset to return results
 * @param {number} limit The amount of results to return
 * @param {number} order The order of results to return
 * @return {Promise<Array<Object>>} All characters' info with a default mood
 */
 async function fetchCharacterInfosWithDefault(offset, limit, order) {
    return processCharInfoRows(
        await charInfo()
            .whereNotNull('char_default')
            .offset(offset)
            .limit(limit)
            .orderByRaw(orderBy(order))
    )
}

/**
 * Fetches the amount of characters
 * @returns {Promise<number>} The amount of characters
 */
async function fetchCharactersCount() {
    return (await knex('moodchars').count('*', { as: 'count' }))[0].count
}

/**
 * Updates a character's default mood
 * @param {number} id The character's ID
 * @param {?number} defaultMood The new default mood's ID (can be null)
 */
async function updateCharacterDefaultById(id, defaultMood) {
    return knex('moodchars')
        .update({
            char_default: defaultMood
        })
        .where('id', id)
}

/**
 * Deletes the character with the specified ID
 * @param {number} id The character ID
 */
async function deleteCharacterById(id) {
    return knex('moodchars')
        .del()
        .where('moodchars.id', id)
}

/* Export functions */
module.exports.createCharacter = createCharacter
module.exports.fetchCharacterInfoById = fetchCharacterInfoById
module.exports.fetchCharacterInfos = fetchCharacterInfos
module.exports.fetchCharacterInfosWithDefault = fetchCharacterInfosWithDefault
module.exports.fetchCharactersCount = fetchCharactersCount
module.exports.updateCharacterDefaultById = updateCharacterDefaultById
module.exports.deleteCharacterById = deleteCharacterById

/* Export values */
module.exports.Order = Order