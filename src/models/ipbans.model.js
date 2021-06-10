const config = require('../../knexfile')
const knex = require('knex')(config)
const utils = require('../utils/misc.util')
const { Knex } = require('knex')

/* Utility functions */
/**
 * @return {Knex}
 */
function banInfo() {
    return knex('ipbans')
        .select('ip')
        .select(knex.ref('ban_created_on').as('created_on'))
}
function processBanInfoRows(rows) {
    for(row of rows) {
        row.created_on = new Date(row.created_on)
    }
    return rows
}

/**
 * Creates a new IP ban
 * @param {number} ip The IP to ban
 */
async function createBan(ip) {
    return await knex('ipbans')
        .insert({ ip })
}

/**
 * Fetches all IP bans
 * @param {number} offset The offset to return results
 * @param {number} limit The amount of results to return
 * @return {Array<Object>} All bans
 */
async function fetchBans(offset, limit) {
    return await knex('ipbans')
        .select('*')
        .offset(offset)
        .limit(limit)
}

/**
 * Fetches info about all IP bans
 * @param {number} offset The offset to return results
 * @param {number} limit The amount of results to return
 * @returns {Array<Object>} All bans' info
 */
async function fetchBanInfos(offset, limit) {
    return processBanInfoRows(
        await banInfo()
            .offset(offset)
            .limit(limit)
    )
}

/**
 * Fetches an IP ban by it IP
 * @param {string} ip The IP
 * @returns {Array<Object>} An array with the row containing the IP ban or an empty array if none exists
 */
async function fetchBanByIp(ip) {
    return await knex('ipbans')
        .select('*')
        .where('ip', ip)
}

/**
 * Fetches an IP ban's info by its IP
 * @param {string} ip The IP
 * @returns {Array<Object>} An array with the row containing the ban's info or an empty array if none exists
 */
async function fetchBanInfoByIp(ip) {
    return processBanInfoRows(
        await banInfo()
            .where('ip', ip)
    )
}

/**
 * Returns the total amount of bans
 * @returns {number} The total amount of bans
 */
async function fetchBansCount() {
    return (await knex('ipbans').count('*', { as: 'count' }))[0].count
}

/**
 * Deletes the ban with the specified IP, if any
 * @param {string} ip The IP
 */
async function deleteBanByIp(ip) {
    return await knex('ipbans')
        .del()
        .where('ip', ip)
}

/* Export functions */
module.exports.createBan = createBan
module.exports.fetchBans = fetchBans
module.exports.fetchBanInfos = fetchBanInfos
module.exports.fetchBanByIp = fetchBanByIp
module.exports.fetchBanInfoByIp = fetchBanInfoByIp
module.exports.fetchBansCount = fetchBansCount
module.exports.deleteBanByIp = deleteBanByIp