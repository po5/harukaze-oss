const usersModel = require('../models/users.model')
const userloginsModel = require('../models/userlogins.model')
const usersUtil = require('../utils/users.util')
const argon2 = require('argon2')

// Puts boilerplate context data
function setupCtx(ctx) {
    ctx.state.pageTitle = 'Log In'
    ctx.state.error = null
    ctx.state.username = ''
}

/**
 * GET controller for sign up page
 * @param {import("koa").Context} ctx The context
 */
module.exports.getLogin = async ctx => {
    // Setup context
    setupCtx(ctx)
    
    // Put next page in context
    let next = ctx.request.query.next ? ctx.request.query.next : '/'
    if(next == '/' && ctx.request.header.referer)
        next = ctx.request.header.referer
    ctx.state.next = next

    // Redirect if already logged in
    if(ctx.state.authed) {
        ctx.state.noRender = true
        ctx.redirect(next)
        return
    }
}

/**
 * POST controller for log in page
 * @param {import("koa").Context} ctx The context
 */
module.exports.postLogin = async ctx => {
    let body = ctx.request.body

    // Setup context
    setupCtx(ctx)

    // Put next page in context
    let next = body.next ? body.next : '/'
    ctx.state.next = next

    // Redirect if already logged in
    if(ctx.state.authed) {
        ctx.state.noRender = true
        ctx.redirect(next)
        return
    }

    // Collect data
    let username = body.username?.trim()
    let password = body.password

    // Fill in username
    ctx.state.username = username

    if(username && password) {
        // Check if user and possible IP ban
        let userRes = await usersModel.fetchUserAndIpBanByUsername(username, ctx.ip)

        if(userRes.length > 0) {
            let user = userRes[0]

            // Check if user is banned
            if(user.user_banned || user.ban_created_on) {
                ctx.state.error = 'You\'re banned!'
            } else {
                // Check password against hash
                if(await argon2.verify(user.user_hash, password)) {
                    // Rehash password necessary
                    if(await argon2.needsRehash(user.user_hash)) {
                        await usersUtil.changeUserPassword(user.id, password)
                    }

                    // Set user ID in session
                    ctx.session.id = user.id

                    // Create login record
                    await userloginsModel.createLogin(user.id, ctx.ip)

                    // Redirect to next
                    ctx.state.noRender = true
                    ctx.redirect(next)
                } else {
                    ctx.state.error = 'Wrong username or password'
                }
            }
        } else {
            ctx.state.error = 'Wrong username or password'
        }
    } else {
        ctx.state.error = 'Missing username or password'
    }
}