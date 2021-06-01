const usersModel = require('../models/users.model')

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
 */
async function createUser(username, bio, password, role, avatarKey) {
    // Hash password
    let hash = await argon2.hash(password)

    // Create user DB entry
    usersModel.createUser(username, bio, hash, role, avatarKey)
}

/* Export functions */
module.exports.createUser = createUser

/* Export values */
module.exports.Roles = Roles