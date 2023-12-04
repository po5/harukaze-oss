import argon2 from 'argon2'
import { createBan } from 'models/ipbans.model'
import { Context, Next } from 'koa'
import { fetchUserAndIpBanByUsername, userRowToBasicInfo } from 'models/users.model'
import { changeUserPassword } from 'utils/users.util'
import { createLogin } from 'models/userlogins.model'

// IP address rate limiting
const ipLimits: {
    [key: string]: {
        tries: number,
        banMins: number,
        bans: number,
        unbanDate: Date | null
    }
} = {}

async function canAttemptLogin(ip: string) {
    if(!(ip in ipLimits)) {
        ipLimits[ip] = {
            tries: 0,
            banMins: 1,
            bans: 0,
            unbanDate: null
        }
    }

    const info = ipLimits[ip]
    const now = new Date()
    
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
        const unbanDate = new Date()
        unbanDate.setMinutes(unbanDate.getMinutes()+info.banMins)
        info.unbanDate = unbanDate

        // Increment ban time
        info.banMins++

        // Increment total bans
        info.bans++

        // If this is the 10th ban, ban the IP address permanently
        if(info.bans >= 10)
            await createBan(ip)
        
        return false
    }

    info.tries++

    return true
}
function clearLoginAttempts(ip: string) {
    delete ipLimits[ip]
}

// Puts boilerplate context data
function setupCtx(ctx: Context) {
    ctx.state.pageTitle = 'Log In'
    ctx.state.error = null
    ctx.state.username = ''
}

/**
 * GET controller for sign up page
 * @param ctx The context
 * @param _next The next function
 */
export async function getLogin(ctx: Context, _next: Next) {
    // Setup context
    setupCtx(ctx)
    
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
 * POST controller for log in page
 * @param ctx The context
 * @param _next The next function
 */
export async function postLogin(ctx: Context, _next: Next) {
    const body = ctx.request.body

    // Setup context
    setupCtx(ctx)

    // Put next page in context
    const next = body.next ? body.next : '/'
    ctx.state.next = next

    // Redirect if already logged in
    if(ctx.state.authed) {
        ctx.state.noRender = true
        ctx.redirect(next)
        return
    }

    // Collect data
    const username = body.username?.trim()
    const password = body.password

    // Fill in username
    ctx.state.username = username

    // Check for username and password
    if(!username || !password) {
        ctx.state.error = 'Missing username or password'
        return
    }

    // Check if user and possible IP ban
    const [ user ] = await fetchUserAndIpBanByUsername(username, ctx.ip)

    // Check if the user exists
    if(user === undefined) {
        ctx.state.error = 'Wrong username or password'
        return
    }

    // Check if user is banned
    if(user.user_banned || user.ban_created_on) {
        ctx.state.error = 'You\'re banned!'
        return
    }

    // Check if IP can attempt a login
    if(!(await canAttemptLogin(ctx.ip))) {
        ctx.state.error = 'You have failed to login too many times, try again later'
        return
    }

    // Check password against hash
    if(!(await argon2.verify(user.user_hash, password))) {
        ctx.state.error = 'Wrong username or password'
        return
    }

    // Clear IP login attempts
    clearLoginAttempts(ctx.ip)

    // Rehash password necessary
    if(argon2.needsRehash(user.user_hash)) {
        await changeUserPassword(userRowToBasicInfo(user), password)
    }

    // Set user ID in session
    (ctx.session as any).id = user.id

    // Create login record
    await createLogin(user.id, ctx.ip)

    // Redirect to next
    ctx.state.noRender = true
    ctx.redirect(next)
}