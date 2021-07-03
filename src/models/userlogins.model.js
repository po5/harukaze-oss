const config = require('../../knexfile')
const knex = require('knex')(config)

/* Utility functions */
function loginInfo() {
    return knex('userlogins')
        .select(knex.ref('login_user').as('user'))
        .select('user_username')
        .select(knex.ref('login_ip').as('ip'))
        .select(knex.ref('login_created_on').as('created_on'))
        .leftJoin('users', 'login_user', 'users.id')
}
function processLoginInfoRows(rows) {
    for(row of rows) {
        row.created_on = new Date(row.created_on)
    }
    return rows
}

/**
 * Creates a new login record for the specified user
 * @param {number} user The user's ID
 * @param {string} ip The IP used to login
 */
async function createLogin(user, ip) {
    return await knex('userlogins')
        .insert({
            login_user: user,
            login_ip: ip
        })
}

/**
 * Fetches all logins by the specified user with a unique IP address
 * @param {number} user The user's ID
 * @returns {Array<Object>} All logins
 */
async function fetchUniqueIpLoginsByUser(user) {
    return await knex('userlogins')
        .select('*')
        .where('login_user', user)
        .groupBy('login_ip')
}

/**
 * Fetches all login infos by the specified user with a unique IP address
 * @param {number} user The user's ID
 * @returns {Array<Object>} All logins' info
 */
async function fetchUniqueIpLoginInfosByUser(user) {
    return processLoginInfoRows(
        await loginInfo()
            .where('login_user', user)
            .groupBy('login_ip')
    )
}

/* Export functions */
module.exports.createLogin = createLogin
module.exports.fetchUniqueIpLoginsByUser = fetchUniqueIpLoginsByUser
module.exports.fetchUniqueIpLoginInfosByUser = fetchUniqueIpLoginInfosByUser