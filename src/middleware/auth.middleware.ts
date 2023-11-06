import { Context, Next } from 'koa'
import { Session } from 'koa-session'
import { fetchUserAndIpBanById } from 'models/users.model'
import { identifyContextWithUserRow } from 'utils/users.util'

/**
 * Middleware that authenticates requests based on session
 * @param ctx The context
 * @param next The next function
 */
export async function authMiddleware(ctx: Context, next: Next) {
    // By default, requests are not authenticated
    ctx.state.authed = false

    try {
        const sess = (ctx.session as Session)

        // Check if there is a user ID in session
        if(isNaN(sess.id)) {
            await next()
            return
        }
        const id = parseInt(sess.id, 10)

        // Fetch user
        const [ user ] = await fetchUserAndIpBanById(id, ctx.ip)

        // Check if user actually exists
        if(!user) {
            // Remove user ID from session if the user doesn't exist
            delete sess.id
            return
        }

        // Check if user is banned
        if(user.user_banned || user.ban_created_on) {
            // Remove user ID from session if the user is banned
            delete sess.id
            return
        }

        // Identify context
        await identifyContextWithUserRow(ctx, user)

        // Mark context as authenticated
        ctx.state.authed = true
    } catch(err) {
        console.error('Error occurred while trying to authenticate request:')
        console.error(err)

        // Nothing can be done at this point, just try to finish the request
    }

    await next()
}