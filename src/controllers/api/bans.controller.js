const usersModel = require('../../models/users.model')
const ipbansModel = require('../../models/ipbans.model')
const userloginsModel = require('../../models/userlogins.model')
const utils = require('../../utils/misc.util')

/**
 * GET controller for banned user listing
 * @param {import("koa").Context} ctx The context
 */
module.exports.getBannedUsers = async ctx => {
    // Collect data
    let body = ctx.request.query
    let offset = isNaN(body.offset) ? 0 : Math.max(body.offset*1, 0)
    let limit = isNaN(body.limit) ? 50 : Math.min(Math.max(body.limit*1, 0), 50)

    // Fetch total banned users
    let total = await usersModel.fetchBannedUsersCount()

    // Fetch banned users
    let users = await usersModel.fetchBannedUserInfos(offset, limit)

    // Send success
    ctx.apiSuccess({ users, total })
}

/**
 * POST controller for user banning and unbanning
 * @param {import('koa').Context} ctx The context
 */
 module.exports.postSetUserBan = async ctx => {
    let body = ctx.request.body
    
    // Check for correct data
    if(body.username != undefined && body.banned != undefined) {
        let username = body.username
        let banned = body.banned?.toLowerCase() == 'true'

        // Make sure user cannot ban self
        if(username.toLowerCase() == ctx.state.user.username.toLowerCase()) {
            ctx.apiError('cannot_ban_self')
            return
        }

        // Fetch user
        let userRes = await usersModel.fetchUserByUsername(username)

        // Check if user exists
        if(userRes.length > 0) {
            let user = userRes[0]

            // Update user ban
            await usersModel.updateUserBannedById(user.id, banned)

            // Success
            ctx.apiSuccess()
        } else {
            ctx.apiError('invalid_user')
        }
    } else {
        ctx.apiError('missing_params')
    }
}

/**
 * GET controller for banned IP listing
 * @param {import("koa").Context} ctx The context
 */
 module.exports.getBannedIps = async ctx => {
    // Collect data
    let body = ctx.request.query
    let offset = isNaN(body.offset) ? 0 : Math.max(body.offset*1, 0)
    let limit = isNaN(body.limit) ? 50 : Math.min(Math.max(body.limit*1, 0), 50)

    // Fetch total banned IPs
    let total = await ipbansModel.fetchBansCount()

    // Fetch banned IPs
    let ips = await ipbansModel.fetchBanInfos(offset, limit)

    // Send success
    ctx.apiSuccess({ ips, total })
}

/**
 * POST controller for IP banning
 * @param {import('koa').Context} ctx The context
 */
 module.exports.postCreateIpBan = async ctx => {
    let body = ctx.request.body
    
    // Check for correct data
    if(body.ip || body.ips || !isNaN(body.user)) {
        let ips

        if(body.ip) {
            ips = [body.ip]
        } else if(body.ips) {
            ips = utils.setToArray(body.ips)
        } else {
            // Fetch user's IPs
            let logins = await userloginsModel.fetchUniqueIpLoginInfosByUser(body.user*1)

            // Add IPs
            ips = new Array(logins.length)
            for(i in logins)
                ips[i] = logins[i].ip
        }

        // Check if there are any IPs to ban at all
        if(ips.length < 1) {
            ctx.apiError('no_ips')
            return
        }

        // Ban IPs
        await ipbansModel.createBans(ips)

        // Success
        ctx.apiSuccess()
    } else {
        ctx.apiError('missing_params')
    }
}

/**
 * POST controller for IP unbanning
 * @param {import('koa').Context} ctx The context
 */
 module.exports.postDeleteIpBan = async ctx => {
    let body = ctx.request.body
    
    // Check for correct data
    if(body.ip || body.ips || !isNaN(body.user)) {
        let ips

        if(body.ip) {
            ips = [body.ip]
        } else if(body.ips) {
            ips = utils.setToArray(body.ips)
        } else {
            // Fetch user's IPs
            let logins = await userloginsModel.fetchUniqueIpLoginInfosByUser(body.user*1)

            // Add IPs
            ips = new Array(logins.length)
            for(i in logins)
                ips[i] = logins[i].ip
        }

        // Unban IPs
        await ipbansModel.deleteBansByIps(ips)

        // Success
        ctx.apiSuccess()
    } else {
        ctx.apiError('missing_params')
    }
}