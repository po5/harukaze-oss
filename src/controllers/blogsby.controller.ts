import { Context, Next } from "koa";
import { fetchUserInfoByUsername } from "models/users.model";
import { fetchPublishedPostCountByAuthor, fetchPublishedPostInfosByAuthor, PostOrder } from "models/posts.model";
import { paginatedRouteInfo } from "utils/pagination.util";

/**
 * GET controller for blog listing by username
 * @param ctx The context
 * @param next The next function
 */
export async function getBlogsBy(ctx: Context, next: Next) {
    const username = ctx.params.username

    // Fetch user
    const [ user ] = await fetchUserInfoByUsername(username)

    // Check if it exists
    if(!user) {
        ctx.state.noRender = true
        await next()
        return
    }

    // Set username in page context
    ctx.state.username = user.username

    // Get results count
    let totalPosts = await fetchPublishedPostCountByAuthor(user.id)
    ctx.state.totalPosts = totalPosts

    // Meta image
    ctx.state.metaImage = '/assets/avatar/'+user.username
    // Meta description
    ctx.state.metaDescription = `View all posts by ${user.username}`

    // Only fetch posts if count is more than 0
    if(totalPosts > 0) {
        // Get pagination info
        let pagination = paginatedRouteInfo(ctx, totalPosts)

        // Fetch posts
        let posts = await fetchPublishedPostInfosByAuthor(user.id, true, pagination.queryOffset, pagination.queryLimit, PostOrder.CREATED_DESC)

        // Put data into context
        ctx.state.pagination = pagination
        ctx.state.posts = posts
    } else {
        // Empty posts
        ctx.state.posts = []
    }
}