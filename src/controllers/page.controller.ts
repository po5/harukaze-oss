import { Context, Next } from 'koa'
import { fetchPageInfoBySlug } from 'models/pages.model'

/**
 * GET controller for user-created pages
 * @param ctx The context
 * @param next The next function
 */
export async function getPage(ctx: Context, next: Next) {
    // Fetch page
    const [ page ] = await fetchPageInfoBySlug(true, ctx.params.slug)

    // Check if page exists
    if(!page) {
        // Not found
        ctx.state.noRender = true
        await next()
        return
    }

    // Page title
    ctx.state.pageTitle = page.title

    // Put context data
    ctx.state.page = page
}