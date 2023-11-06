import { Context, Next } from 'koa'
import { fetchPostsCount, fetchPublishedPostInfos, PostOrder } from 'models/posts.model'
import { paginatedRouteInfo } from 'utils/pagination.util'

/**
 * GET controller for homepage
 * @param ctx The context
 * @param _next The next function
 */
export async function getHome(ctx: Context, _next: Next) {
    // Fetch total posts
    const totalPosts = await fetchPostsCount()

    // Get pagination info
    const pagination = paginatedRouteInfo(ctx, totalPosts)

    // Fetch posts
    ctx.state.posts = await fetchPublishedPostInfos(true, pagination.queryOffset, pagination.queryLimit, PostOrder.CREATED_DESC)
    
    // Put pagination information
    ctx.state.pagination = pagination
}