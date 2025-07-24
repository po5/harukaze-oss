import { Context, Next } from 'koa'

/**
 * GET controller for comments page
 * @param ctx The context
 * @param next The next function
 */
export async function getCommentsPage(ctx: Context, next: Next) {
    // Page title
    ctx.state.pageTitle = 'Comments'
}
