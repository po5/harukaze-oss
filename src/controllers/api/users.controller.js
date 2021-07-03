const usersModel = require('../../models/users.model')
const utils = require('../../utils/misc.util')
const { Roles } = require('../../utils/users.util')

/**
 * GET controller for user listing
 * @param {import("koa").Context} ctx The context
 */
module.exports.getUsers = async ctx => {
    // Collect data
    let body = ctx.request.query
    let offset = isNaN(body.offset) ? 0 : Math.max(body.offset*1, 0)
    let limit = isNaN(body.limit) ? 50 : Math.min(Math.max(body.limit*1, 0), 50)

    // Determine if roles are specified
    let roles
    if(!isNaN(body.role)) {
        roles = [body.role*1]
    } else if(body.roles) {
        roles = []
        let tmp = utils.setToArray(body.roles)
        for(role of tmp)
            if(!isNaN(role))
                roles.push(role*1)
    } else {
        roles = Object.keys(Roles)
    }

    // Fetch total users
    let total = await usersModel.fetchUsersCountByRoles(roles)

    // Fetch users
    let users = await usersModel.fetchUserInfosByRoles(roles, offset, limit)

    // Send success
    ctx.apiSuccess({ users, total })
}

/**
 * POST controller for setting user roles
 * @param {import('koa').Context} ctx The context
 */
 module.exports.postSetRole = async ctx => {
    let body = ctx.request.body
    
    // Check for correct data
    if(body.username != undefined && (!isNaN(body.role) || !isNaN(body.delta))) {
        let username = body.username
        let role = body.role*1
        let delta = body.delta*1

        // Make sure user cannot modify self
        if(username.toLowerCase() == ctx.state.user.username.toLowerCase()) {
            ctx.apiError('cannot_change_self')
            return
        }

        // Fetch user
        let userRes = await usersModel.fetchUserByUsername(username)

        // Check if user exists
        if(userRes.length > 0) {
            let user = userRes[0]

            // Use delta if specified
            if(!isNaN(delta))
                role = user.user_role+delta

            // Validate role
            if(role < 0 || role >= Object.keys(Roles).length) {
                ctx.apiError('invalid_role')
                return
            }

            // Update user role
            await usersModel.updateUserRoleById(user.id, role)

            // Success
            ctx.apiSuccess()
        } else {
            ctx.apiError('invalid_user')
        }
    } else {
        ctx.apiError('missing_params')
    }
}