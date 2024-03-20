import config from '../../config.json'
import { Context, Next } from 'koa'
import { Session } from 'koa-session'
import { appSzurubooruClient } from 'utils/szurubooru.util'

/**
 * GET controller for log out page
 * @param ctx The context
 * @param _next The next function
 */
export async function getLogout(ctx: Context, _next: Next) {
    // Figure out where to go next
    let next = ctx.request.query.next ? ctx.request.query.next as string : '/'
    if(next == '/' && ctx.request.header.referer)
        next = ctx.request.header.referer
    ctx.state.next = next

    // Remove user ID from session
    delete (ctx.session as Session).id

    if (appSzurubooruClient !== null) {
        ctx.cookies.set(
            config.szurubooru.authCookieName,
            '{}',
            { httpOnly: false },
        )
    }

    // Redirect
    ctx.redirect(next)
}
