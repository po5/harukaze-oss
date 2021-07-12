const usersModel = require('../models/users.model')
const userloginsModel = require('../models/userlogins.model')
const usersUtil = require('../utils/users.util')
const ipbansModel = require('../models/ipbans.model')
const argon2 = require('argon2')

// IP address rate limiting
const ipLimits = {}

async function canAttemptLogin(ip) {
    if(!(ip in ipLimits)) {
        ipLimits[ip] = {
            tries: 0,
            banMins: 1,
            bans: 0,
            unbanDate: null
        }
    }

    let info = ipLimits[ip]
    let now = new Date()
    
    if(info.unbanDate) {
        if(now > info.unbanDate) {
            // Ban time is over, unban
            info.unbanDate = null
        } else {
            // Still banned
            return false
        }
    } else if(info.tries > 5) {
        // Reset tries
        info.tries = 0

        // Ban IP
        let unbanDate = new Date()
        unbanDate.setMinutes(unbanDate.getMinutes()+info.banMins)
        info.unbanDate = unbanDate

        // Increment ban time
        info.banMins++

        // Increment total bans
        info.bans++

        // If this is the 10th ban, ban the IP address permanently
        if(info.bans >= 10)
            await ipbansModel.createBan(ip)
        
        return false
    }

    info.tries++

    return true
}
function clearLoginAttempts(ip) {
    delete ipLimits[ip]
}

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
    if(next.endsWith(ctx.path))
        next = '/'
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
    let username = body.username
    if(username)
        username = username.trim()
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
                // Check if IP can attempt a login
                if(await canAttemptLogin(ctx.ip)) {
                    // Check password against hash
                    if(await argon2.verify(user.user_hash, password)) {
                        // Clear IP login attempts
                        clearLoginAttempts(ctx.ip)

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
                } else {
                    ctx.state.error = 'You have failed to login too many times, try again later'
                }
            }
        } else {
            ctx.state.error = 'Wrong username or password'
        }
    } else {
        ctx.state.error = 'Missing username or password'
    }
}