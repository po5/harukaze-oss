import { Context, Next } from 'koa'
import { UserRoles } from 'utils/users.util'

/**
 * GET controller for moods panel page
 * @param ctx The context
 * @param next The next function
 */
export async function getMoodsPanel(ctx: Context, next: Next) {
    // Deal with unauthenticated and unauthorized users
    if(!ctx.state.authed) {
        ctx.state.noRender = true
        ctx.redirect('/login?next='+encodeURIComponent(ctx.path))
        return
    }

    // Check if user is a contributor
    if(ctx.state.user.role < UserRoles.ADMIN) {
        ctx.state.noRender = true
        await next()
        return
    }

    // Page title
    ctx.state.pageTitle = 'Moods Panel'
}