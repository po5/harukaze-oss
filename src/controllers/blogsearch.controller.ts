import { Context, Next } from "koa";
import { getPostTags } from "utils/tags.util";
import {
    fetchPublishedPostCountWherePostLike,
    fetchPublishedPostInfosWherePostLike,
    PostOrder
} from "models/posts.model";
import { paginatedRouteInfo } from "utils/pagination.util";

/**
 * GET controller for blog search page
 * @param ctx The context
 * @param _next The next function
 */
export async function getBlogSearch(ctx: Context, _next: Next) {
    const query = ctx.query.query as string

    // Fetch blog tags
    ctx.state.tags = getPostTags()

    // Search if query is preset
    if(query) {
        ctx.state.query = query
        ctx.state.showForm = false

        // Work out search pattern
        const pattern = '%'+query.replace(/%/g, '|%')+'%'

        // Get results count
        const totalPosts = await fetchPublishedPostCountWherePostLike(pattern)
        ctx.state.totalPosts = totalPosts

        // Only fetch posts if count is more than 0
        if(totalPosts > 0) {
            // Get pagination info
            const pagination = paginatedRouteInfo(ctx, totalPosts)

            // Fetch posts
            const posts = await fetchPublishedPostInfosWherePostLike(pattern, true, pagination.queryOffset, pagination.queryLimit, PostOrder.CREATED_DESC)

            // Put data into context
            ctx.state.pagination = pagination
            ctx.state.posts = posts
        } else {
            // Empty posts
            ctx.state.posts = []
        }
    } else {
        // Show search form
        ctx.state.showForm = true
    }
}