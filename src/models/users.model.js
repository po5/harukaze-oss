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
        .select(knex.ref('user_username').as('username'))
        .select(knex.ref('user_bio').as('bio'))
        .select(knex.ref('user_role').as('role'))
        .select(knex.ref('user_avatar_key').as('avatar_key'))
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
 * @param {string} bio The user's bio (can be null)
 * @param {string} hash The user's password hash
 * @param {number} role The user's role (values defined in Roles object)
 * @param {string} avatarKey The user's avatar key (can be null)
 */
async function createUser(username, bio, hash, role, avatarKey) {
    return await knex('users')
        .insert({
            user_username: username,
            user_bio: bio,
            user_hash: hash,
            role: role,
            avatar_key: avatarKey
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
            .offset(offset)
            .limit(limit)
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
        .where('user_username', username)
}

/**
 * Fetches a user's info by its username
 * @param {string} username The user's username
 * @return {Array<Object>} An array with the row containing the user's info or an empty array if none exists
 */
async function fetchUserInfoByUsername(username) {
    return processUserInfoRows(
        await userInfo()
            .where('user_username', username)
            .offset(offset)
            .limit(limit)
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

/* Export functions */
module.exports.createUser = createUser
module.exports.fetchUserById = fetchUserById
module.exports.fetchUserInfoById = fetchUserInfoById
module.exports.fetchUserByUsername = fetchUserByUsername
module.exports.fetchUserInfoByUsername = fetchUserInfoByUsername
module.exports.fetchContributorInfos = fetchContributorInfos