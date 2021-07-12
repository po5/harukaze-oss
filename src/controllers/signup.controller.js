const usersModel = require('../models/users.model')
const ipbansModel = require('../models/ipbans.model')
const userloginsModel = require('../models/userlogins.model')
const moodsUtil = require('../utils/moods.util')
const usersUtil = require('../utils/users.util')

// Puts boilerplate context data
async function setupCtx(ctx) {
    ctx.state.pageTitle = 'Sign Up'
    ctx.state.error = null
    ctx.state.username = ''

    // Setup captcha
    await ctx.createCaptcha()

    // Fetch characters
    ctx.state.characters = await moodsUtil.getUsableCharacters()
}

/**
 * GET controller for sign up page
 * @param {import("koa").Context} ctx The context
 */
module.exports.getSignup = async ctx => {
    // Setup context
    await setupCtx(ctx)

    // Redirect to home if no characters are available
    if(ctx.state.characters.length < 1) {
        ctx.state.noRender = true
        ctx.redirect('/home')
        return
    }
    
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
 * POST controller for sign up page
 * @param {import("koa").Context} ctx The context
 */
module.exports.postSignup = async ctx => {
    let body = ctx.request.body

    // Setup context
    await setupCtx(ctx)

    // Redirect to home if no characters are available
    if(ctx.state.characters.length < 1) {
        ctx.state.noRender = true
        ctx.redirect('/home')
        return
    }

    // Put next page in context
    let next = body.next ? body.next : '/'
    ctx.state.next = next

    // Redirect if already logged in
    if(ctx.state.authed) {
        ctx.state.noRender = true
        ctx.redirect(next)
        return
    }

    // Check captcha
    if(!ctx.validateCaptcha()) {
        ctx.state.error = 'You failed the captcha, try again'
        return
    }

    // Collect data
    let username = body.username
    if(username)
        username = username.trim()
    let password = body.password
    let charId = body.character*1

    // Fill in username
    ctx.state.username = username

    // Validate data
    if(!username || !password || isNaN(charId)) {
        ctx.state.error = 'Missing username, password, or character'
        return
    }

    // Fetch character
    let char = await moodsUtil.getCharacterById(charId)

    // Check if it exists
    if(!char) {
        ctx.state.error = 'Invalid character ID'
        return
    }

    // Check if username is valid
    if(!usersUtil.isUsernameValid(username)) {
        ctx.state.error = 'That username is invalid'
        return
    }

    // Check if user is IP banned
    if((await ipbansModel.fetchBanByIp(ctx.ip)).length > 0) {
        ctx.state.error = 'Your IP address is banned'
        return
    }

    let userRes = await usersModel.fetchUserByUsername(username)
                
    // Check if username already exists
    if(userRes.length > 0) {
        ctx.state.error = 'Someone else already has that name...'
        return
    }

    // Create user
    await usersUtil.createUser(username, null, password, usersUtil.Roles.USER, null, char.id)

    // Fetch the new user's ID and authenticate
    let newUserRes = await usersModel.fetchUserByUsername(username)
    if(newUserRes.length > 0) {
        let newUser = newUserRes[0]

        // Create initial login record
        await userloginsModel.createLogin(newUser.id, ctx.ip)

        // Set user ID in session
        ctx.session.id = newUser.id
    } else {
        // The account can't be found, so as a last resort, redirect to login page
        next = '/login'
    }

    // Redirect to next
    ctx.state.noRender = true
    ctx.redirect(next)
}