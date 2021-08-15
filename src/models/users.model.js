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
        .select(knex.ref('char_name').as('character_name'))
        .select(knex.ref('char_default').as('character_default'))
        .select(knex.ref('user_info').as('info'))
        .select(knex.ref('user_banned').as('banned'))
        .select(knex.ref('user_created_on').as('created_on'))
        .select(knex.raw(`(
            SELECT COUNT(*)
            FROM \`comments\`
            WHERE \`comment_author\` = \`users\`.\`id\`
        ) AS \`comments\``))
        .select(knex.raw(`(
            SELECT login_ip FROM userlogins
            WHERE login_user = users.id
            ORDER BY id DESC
            LIMIT 1
        ) AS \`last_ip\``))
        .leftJoin('moodchars', 'user_character', 'moodchars.id')
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
 * @param {string?} info The user's info (can be null)
 * @param {number} character The user's character ID
 */
async function createUser(username, bio, hash, role, avatarKey, info, character) {
    return await knex('users')
        .insert({
            user_username: username,
            user_bio: bio,
            user_hash: hash,
            user_role: role,
            user_avatar_key: avatarKey,
            user_info: info,
            user_character: character
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
 * @return {Promise<Array<Object>>} An array with the row containing the user's info or an empty array if none exists
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
 * Fetches all banned users' info
 * @param {number} offset The offset to return results
 * @param {number} limit The amount of results to return
 * @returns {Array<Object>} All banned users' info
 */
async function fetchBannedUserInfos(offset, limit) {
    return processUserInfoRows(
        await userInfo()
            .where('user_banned', true)
            .offset(offset)
            .limit(limit)
    )
}

/**
 * Fetches all users' info with the specified roles
 * @param {Array<number>} roles The roles
 * @param {number} offset The offset to return results
 * @param {number} limit The amount of results to return
 * @returns {Array<Object>} All users' info with the specified roles
 */
async function fetchUserInfosByRoles(roles, offset, limit) {
    return processUserInfoRows(
        await userInfo()
            .whereIn('user_role', roles)
            .offset(offset)
            .limit(limit)
    )
}

/**
 * Returns the total amount of users
 * @returns {number} The total amount of users
 */
async function fetchUsersCount() {
    return (await knex('users').count('*', { as: 'count' }))[0].count
}

/**
 * Returns the total amount of banned users
 * @returns {number} The total amount of banned users
 */
async function fetchBannedUsersCount() {
    return (await knex('users')
        .where('user_banned', true)
        .count('*', { as: 'count' }))[0].count
}

/**
 * Returns the total amount of users with the specified roles
 * @param {Array<number>} roles The roles
 * @returns {Array<number>} The total amount of users with the specified roles
 */
 async function fetchUsersCountByRoles(roles) {
    return (await knex('users')
        .whereIn('user_role', roles)
        .count('*', { as: 'count' }))[0].count
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
 * @param {number} character The user's new character ID
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

/**
 * Updates whether a user is banned
 * @param {number} id The user's ID
 * @param {boolean} banned Whether the user is banned
 */
async function updateUserBannedById(id, banned) {
    return await knex('users')
        .update({
            user_banned: banned
        })
        .where('id', id)
}

/**
 * Updates a user's role
 * @param {number} id The user's ID
 * @param {number} role The user's new role
 */
async function updateUserRoleById(id, role) {
    return await knex('users')
        .update({
            user_role: role
        })
        .where('id', id)
}

/**
 * Updates all users with the specified old ID to use the provided new ID
 * @param {number} oldChar The old character ID to replace
 * @param {number} newChar The new character ID
 */
async function updateUserCharacterByCharacter(oldChar, newChar) {
    return await knex('users')
        .update({
            user_character: newChar
        })
        .where('user_character', oldChar)
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
module.exports.fetchBannedUserInfos = fetchBannedUserInfos
module.exports.fetchUserInfosByRoles = fetchUserInfosByRoles
module.exports.fetchUsersCount = fetchUsersCount
module.exports.fetchBannedUsersCount = fetchBannedUsersCount
module.exports.fetchUsersCountByRoles = fetchUsersCountByRoles
module.exports.updateUserHashById = updateUserHashById
module.exports.updateUserInfoById = updateUserInfoById
module.exports.updateUserAvatarKeyById = updateUserAvatarKeyById
module.exports.updateUserBannedById = updateUserBannedById
module.exports.updateUserRoleById = updateUserRoleById
module.exports.updateUserCharacterByCharacter = updateUserCharacterByCharacter