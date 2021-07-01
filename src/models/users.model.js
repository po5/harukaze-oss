const config = require('../../knexfile')
const knex = require('knex')(config)
const { Roles } = require('../utils/users.util')
const { Knex } = require('knex')

/* Utility functions */
/**
 * @return {Knex}
 */
function userInfo() {
    return knex('users')
        .select('users.id')
        .select(knex.ref('user_username').as('username'))
        .select(knex.ref('user_bio').as('bio'))
        .select(knex.ref('user_role').as('role'))
        .select(knex.ref('user_avatar_key').as('avatar_key'))
        .select(knex.ref('user_character').as('character'))
        .select(knex.ref('user_info').as('info'))
        .select(knex.ref('user_banned').as('banned'))
        .select(knex.ref('user_created_on').as('created_on'))
}
function processUserInfoRows(rows) {
    for(row of rows) {
        row.created_on = new Date(row.created_on)
    }
    return rows
}

/**
 * Creates a new user entry.
 * To create a new user normally, you should use createUser in users.util.js.
 * @param {string} username The user's username
 * @param {string?} bio The user's bio (can be null)
 * @param {string} hash The user's password hash
 * @param {number} role The user's role (values defined in Roles object)
 * @param {string} avatarKey The user's avatar key (can be null)
 * @param {string?} avatarKey The user's info (can be null)
 */
async function createUser(username, bio, hash, role, avatarKey, info) {
    return await knex('users')
        .insert({
            user_username: username,
            user_bio: bio,
            user_hash: hash,
            user_role: role,
            user_avatar_key: avatarKey,
            user_info: info
        })
}

/**
 * Fetches a user by its ID
 * @param {number} id The user's ID
 * @return {Array<Object>} An array with the row containing the user or an empty array if none exists
 */
async function fetchUserById(id) {
    return await knex('users')
        .select('*')
        .where('id', id)
}

/**
 * Fetches a user's info by its ID
 * @param {number} id The user's ID
 * @return {Array<Object>} An array with the row containing the user's info or an empty array if none exists
 */
async function fetchUserInfoById(id) {
    return processUserInfoRows(
        await userInfo()
            .where('id', id)
    )
}

/**
 * Fetches a user by its username
 * @param {string} username The user's username
 * @return {Array<Object>} An array with the row containing the user or an empty array if none exists
 */
async function fetchUserByUsername(username) {
    return await knex('users')
        .select('*')
        .where(knex.raw('LOWER(`user_username`)'), username.toLowerCase())
}

/**
 * Fetches a user's info by its username
 * @param {string} username The user's username
 * @return {Array<Object>} An array with the row containing the user's info or an empty array if none exists
 */
async function fetchUserInfoByUsername(username) {
    return processUserInfoRows(
        await userInfo()
            .where(knex.raw('LOWER(`user_username`)'), username)
    )
}

/**
 * Fetches all contributors' info
 * @param {number} offset The offset to return results
 * @param {number} limit The amount of results to return
 * @returns {Array<Object>} All contributors' info
 */
async function fetchContributorInfos(offset, limit) {
    return processUserInfoRows(
        await userInfo()
            .where('user_role', Roles.CONTRIBUTOR)
            .orWhere('user_role', Roles.ADMIN)
            .offset(offset)
            .limit(limit)
    )
}

/**
 * Fetches all admins' info
 * @param {number} offset The offset to return results
 * @param {number} limit The amount of results to return
 * @returns {Array<Object>} All admins' info
 */
async function fetchAdminInfos(offset, limit) {
    return processUserInfoRows(
        await userInfo()
            .orWhere('user_role', Roles.ADMIN)
            .offset(offset)
            .limit(limit)
    )
}

/**
 * Fetches a user by its ID and a row containing when the provided IP was banned, or null if not banned
 * @param {number} id The user's ID
 * @param {string} ip The IP to check if banned
 * @returns {Array<Object>} An array with the row containing the user or an empty array if none exists
 */
async function fetchUserAndIpBanById(id, ip) {
    return await knex('users')
        .select('*')
        .select(knex.raw(`(
            SELECT \`ban_created_on\`
            FROM \`ipbans\`
            WHERE \`ip\` = ?
        ) as \`ban_created_on\``, [ip]))
        .where('id', id)
}

/**
 * Fetches a user by its username and a row containing when the provided IP was banned, or null if not banned
 * @param {string} username The user's username
 * @param {string} ip The IP to check if banned
 * @returns {Array<Object>} An array with the row containing the user or an empty array if none exists
 */
async function fetchUserAndIpBanByUsername(username, ip) {
    return await knex('users')
        .select('*')
        .select(knex.raw(`(
            SELECT \`ban_created_on\`
            FROM \`ipbans\`
            WHERE \`ip\` = ?
        ) as \`ban_created_on\``, [ip]))
        .where('user_username', username)
}

/**
 * Updates a user's password hash.
 * To change a user's password, you should use changeUserPassword in users.util.js.
 * @param {number} id The user's ID
 * @param {string} hash The new password hash
 */
async function updateUserHashById(id, hash) {
    return await knex('users')
        .update({
            user_hash: hash
        })
        .where('id', id)
}

/**
 * Updates a user's info
 * @param {number} id The user's ID
 * @param {string?} bio The user's new bio (can be null)
 * @param {string} character The user's new character
 * @param {string?} info The user's new info (can be null)
 */
async function updateUserInfoById(id, bio, character, info) {
    return await knex('users')
        .update({
            user_bio: bio,
            user_character: character,
            user_info: info
        })
        .where('id', id)
}

/**
 * Updates a user's avatar key
 * @param {number} id The user's ID
 * @param {string?} bio The user's new avatar key (can be null)
 */
async function updateUserAvatarKeyById(id, avatarKey) {
    return await knex('users')
        .update({
            user_avatar_key: avatarKey
        })
        .where('id', id)
}

/* Export functions */
module.exports.createUser = createUser
module.exports.fetchUserById = fetchUserById
module.exports.fetchUserInfoById = fetchUserInfoById
module.exports.fetchUserByUsername = fetchUserByUsername
module.exports.fetchUserInfoByUsername = fetchUserInfoByUsername
module.exports.fetchContributorInfos = fetchContributorInfos
module.exports.fetchAdminInfos = fetchAdminInfos
module.exports.fetchUserAndIpBanById = fetchUserAndIpBanById
module.exports.fetchUserAndIpBanByUsername = fetchUserAndIpBanByUsername
module.exports.updateUserHashById = updateUserHashById
module.exports.updateUserInfoById = updateUserInfoById
module.exports.updateUserAvatarKeyById = updateUserAvatarKeyById