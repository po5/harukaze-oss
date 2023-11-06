import { Context, Next } from 'koa'
import { fetchPublishedPostCountByTag, fetchPublishedPostInfosByTag, PostOrder } from 'models/posts.model'
import { paginatedRouteInfo } from 'utils/pagination.util'

/**
 * GET controller for blog tag page
 * @param ctx The context
 * @param _next The next function
 */
export async function getBlogTag(ctx: Context, _next: Next) {
    const tag = ctx.params.tag

    // Put tag in context
    ctx.state.tag = tag

    // Put title
    ctx.state.pageTitle = `Posts for tag "${tag}"`

    // Fetch total posts
    const totalPosts = await fetchPublishedPostCountByTag(tag)

    // Check if there are any posts
    if(totalPosts > 0) {
        ctx.state.postsPresent = true

        // Get pagination info
        const pagination = paginatedRouteInfo(ctx, totalPosts)

        // Fetch posts
        ctx.state.posts = await fetchPublishedPostInfosByTag(tag, true, pagination.queryOffset, pagination.queryLimit, PostOrder.CREATED_DESC)
        
        // Put pagination information
        ctx.state.pagination = pagination
    } else {
        ctx.state.postsPresent = false

        // Nothing else to do
    }
}