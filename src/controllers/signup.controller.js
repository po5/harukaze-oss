const usersModel = require('../models/users.model')
const ipbansModel = require('../models/ipbans.model')
const usersUtil = require('../utils/users.util')

// Puts boilerplate context data
function setupCtx(ctx) {
    ctx.state.pageTitle = 'Sign Up'
    ctx.state.error = null
    ctx.state.username = ''
}

/**
 * GET controller for sign up page
 * @param {import("koa").Context} ctx The context
 */
module.exports.getSignup = async ctx => {
    // Setup context
    setupCtx(ctx)
    
    // Put next page in context
    let next = ctx.request.query.next ? ctx.request.query.next : '/'
    if(next == '/' && ctx.request.header.referer)
        next = ctx.request.header.referer
    ctx.state.next = next

    // Redirect if already logged in
    if(ctx.state.authed) {
        ctx.redirect(next)
        return
    }
}

/**
 * POST controller for sign up page
 * @param {import("koa").Context} ctx The context
 */
module.exports.postSignup = async ctx => {
    let body = ctx.request.body

    // Setup context
    setupCtx(ctx)

    // Put next page in context
    let next = body.next ? body.next : '/'
    ctx.state.next = next

    // Redirect if already logged in
    if(ctx.state.authed) {
        ctx.redirect(next)
        return
    }

    // Collect data
    let username = body.username.trim()
    let password = body.password

    // Fill in username
    ctx.state.username = username

    if(username && password) {
        // Check if username is valid
        if(usersUtil.isUsernameValid(username)) {
            // Check if user is IP banned
            if((await ipbansModel.fetchBanByIp(ctx.ip)).length > 0) {
                ctx.state.error = 'Your IP address is banned'
            } else {
                let userRes = await usersModel.fetchUserByUsername(username)
                
                // Check if username already exists
                if(userRes.length > 0) {
                    ctx.state.error = 'Someone else already has that name...'
                } else {
                    // Create user
                    await usersUtil.createUser(username, null, password, usersUtil.Roles.USER, null)

                    // Fetch the new user's ID and authenticate
                    let newUserRes = await usersModel.fetchUserByUsername(username)
                    if(newUserRes.length > 0) {
                        let newUser = newUserRes[0]

                        // Set user ID in session
                        ctx.session.id = newUser.id
                    } else {
                        // The account can't be found, so as a last resort, redirect to login page
                        next = '/login'
                    }

                    // Redirect to next
                    ctx.redirect(next)
                }
            }
        } else {
            ctx.state.error = 'That username is invalid'
        }
    } else {
        ctx.state.error = 'Missing username or password'
    }
}