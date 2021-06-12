const config = require('../../knexfile')
const knex = require('knex')(config)
const utils = require('../utils/misc.util')
const { Knex } = require('knex')

/* Utility functions */
/**
 * @return {Knex}
 */
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
        row.tags = utils.setToArray(row.tags)
        row.referenced_media = utils.setToArray(row.referenced_media)
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

/* Export functions */
module.exports.createLogin = createLogin