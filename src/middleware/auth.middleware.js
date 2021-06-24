const usersModel = require('../models/users.model')
const usersUtil = require('../utils/users.util')

/**
 * Middleware that authenticates requests based on session
 * @param {import("koa").Context} ctx The context
 * @param {Function} next The next route to call
 */
module.exports = async (ctx, next) => {
    // By default, requests are not authenticated
    ctx.state.authed = false

    try {
        // Check if there is a user ID in session
        if(!isNaN(ctx.session.id)) {
            let id = ctx.session.id*1

            // Fetch user
            let userRes = await usersModel.fetchUserAndIpBanById(id, ctx.ip)
            
            // Check if user actually exists
            if(userRes.length > 0) {
                let user = userRes[0]

                // Check if user is banned
                if(user.user_banned || user.ban_created_on) {
                    // Remove user ID from session
                    delete ctx.session.id
                } else {
                    // Identify context
                    usersUtil.identifyContextWithUserRow(ctx, user)

                    // Mark context as authenticated
                    ctx.state.authed = true
                }
            } else {
                // Remove user ID from session
                delete ctx.session.id
            }
        }
    } catch(err) {
        console.error('Error occurred while trying to authenticate request:')
        console.error(err)

        // Nothing can be done at this point, just try to finish the request
    }

    await next()
}