import { Context, Next } from 'koa'
import { Session } from 'koa-session'
import { getCharacterById, getUsableCharacters } from 'utils/moods.util'
import { createUser, isUsernameValid, UserRoles } from 'utils/users.util'
import { fetchBanByIp } from 'models/ipbans.model'
import { fetchUserByUsername } from 'models/users.model'
import { createLogin } from 'models/userlogins.model'

// Puts boilerplate context data
async function setupCtx(ctx: Context) {
    ctx.state.pageTitle = 'Sign Up'
    ctx.state.error = null
    ctx.state.username = ''

    // Setup captcha
    await ctx.createCaptcha()

    // Fetch characters
    ctx.state.characters = await getUsableCharacters()
}

/**
 * GET controller for sign up page
 * @param ctx The context
 * @param _next The next function
 */
export async function getSignup(ctx: Context, _next: Next) {
    // Setup context
    await setupCtx(ctx)

    // Redirect to home if no characters are available
    if(ctx.state.characters.length < 1) {
        ctx.state.noRender = true
        ctx.redirect('/home')
        return
    }
    
    // Put next page in context
    let next = (ctx.request.query.next as string) || '/'
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
 * @param ctx The context
 * @param _next The next function
 */
export async function postSignup(ctx: Context, _next: Next) {
    const body = ctx.request.body

    // Setup context
    await setupCtx(ctx)

    // Redirect to home if no characters are available
    if(ctx.state.characters.length < 1) {
        ctx.state.noRender = true
        ctx.redirect('/home')
        return
    }

    // Put next page in context
    let next = (body.next as string) || '/'
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
    const username = body.username?.trim()
    const password = body.password as string | undefined
    const charId = parseInt(body.character, 10)

    // Fill in username
    ctx.state.username = username

    // Validate data
    if(!username || !password || isNaN(charId)) {
        ctx.state.error = 'Missing username, password, or character'
        return
    } else if(password?.includes(username)) {
        ctx.state.error = 'Your password cannot contain your username'
        return
    } else if(password?.length < 8) {
        ctx.state.error = 'Your password must be at least 8 characters long'
        return
    }

    // Fetch character
    const char = await getCharacterById(charId)

    // Check if it exists
    if(!char) {
        ctx.state.error = 'Invalid character ID'
        return
    }

    // Check if username is valid
    if(!isUsernameValid(username)) {
        ctx.state.error = 'That username is invalid'
        return
    }

    // Check if user is IP banned
    if((await fetchBanByIp(ctx.ip)).length > 0) {
        ctx.state.error = 'Your IP address is banned'
        return
    }

    // Check if username already exists
    if((await fetchUserByUsername(username)).length > 0) {
        ctx.state.error = 'Someone else already has that name...'
        return
    }

    // Create user
    await createUser(username, null, password, UserRoles.USER, null, char.id)

    // Fetch the new user's ID and authenticate
    const [ newUser ] = await fetchUserByUsername(username)
    if(newUser) {
        // Create initial login record
        await createLogin(newUser.id, ctx.ip);

        // Set user ID in session
        (ctx.session as Session).id = newUser.id
    } else {
        // The account can't be found, so as a last resort, redirect to login page
        next = '/login'
    }

    // Redirect to next
    ctx.state.noRender = true
    ctx.redirect(next)
}