const argon2 = require('argon2')
const usersModel = require('../models/users.model')
const moodUtils = require('../utils/moods.util')

/**
 * User roles
 */
const Roles = {
    /**
     * Normal user
     */
    USER: 0,
    /**
     * Site contributor
     */
    CONTRIBUTOR: 1,
    /**
     * Site administrator
     */
    ADMIN: 2
}

/**
 * Creates a new user
 * @param {string} username The user's username
 * @param {string} bio The user's bio (can be null)
 * @param {string} hash The user's password
 * @param {number} role The user's role (values defined in Roles object)
 * @param {string} avatarKey The user's avatar key (can be null)
 * @param {number} character The user's character ID 
 */
async function createUser(username, bio, password, role, avatarKey, character) {
    // Hash password
    let hash = await argon2.hash(password)

    // Create user DB entry
    await usersModel.createUser(username, bio, hash, role, avatarKey, null, character)
}

/**
 * Tests whether the provided username is valid
 * @param {string} username The username to test
 * @returns {boolean} Whether the username is valid
 */
function isUsernameValid(username) {
    return /^[a-zA-Z0-9_-]{1,16}$/g.test(username)
}

/**
 * Identifies a context using a user row
 * @param {import('koa').Context} ctx The context to identify
 * @param {Object} userRow The database row
 */
async function identifyContextWithUserRow(ctx, userRow) {
    ctx.user = userRow

    // Fetch user's character
    let char = await moodUtils.getCharacterById(userRow.user_character)

    ctx.state.user = {
        id: userRow.id,
        username: userRow.user_username,
        bio: userRow.user_bio,
        role: userRow.user_role,
        avatarKey: userRow.user_avatar_key,
        character: userRow.user_character,
        characterName: char?.name || null,
        characterDefault: char?.default || null,
        characterMoods: await moodUtils.getMoodsByCharacter(userRow.user_character),
        info: userRow.user_info,
        banned: userRow.user_banned == 1,
        createdOn: new Date(userRow.user_created_on)
    }
}

/**
 * Changes a user's password
 * @param {number} id The user's ID
 * @param {string} password The new password
 */
async function changeUserPassword(id, password) {
    // Hash password
    let hash = await argon2.hash(password)

    // Update hash
    await usersModel.updateUserHashById(id, hash)
}

/* Export functions */
module.exports.createUser = createUser
module.exports.isUsernameValid = isUsernameValid
module.exports.identifyContextWithUserRow = identifyContextWithUserRow
module.exports.changeUserPassword = changeUserPassword

/* Export values */
module.exports.Roles = Roles