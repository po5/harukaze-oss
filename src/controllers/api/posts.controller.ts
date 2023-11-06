import { Context, Next } from 'koa'
import { extractOffsetAndLimit } from 'utils/pagination.util'
import { MAX_API_PAGINATION_LIMIT } from 'root/constants'
import { fetchPostInfoById, fetchPostInfos, fetchPostsCount, PostOrder } from 'models/posts.model'
import { deletePostsAndDependentsByIds } from 'utils/posts.util'
import { setToArray } from 'utils/misc.util'

/**
 * GET controller for post getting
 * @param ctx The context
 * @param _next The next function
 */
export async function getPost(ctx: Context, _next: Next) {
    const body = ctx.request.query

    // Check for ID
    const id = parseInt(body.id as string, 10)
    if(isNaN(id)) {
        ctx.apiError('missing_params')
        return
    }

    // Fetch post
    const [ post ] = await fetchPostInfoById(false, id)

    // Check if it exists
    if(!post) {
        ctx.apiError('not_found')
        return
    }

    ctx.apiSuccess({ post })
}

/**
 * GET controller for post listing
 * @param ctx The context
 * @param _next The next function
 */
export async function getPostsList(ctx: Context, _next: Next) {
    // Collect data
    const body = ctx.request.query
    const { offset, limit } = extractOffsetAndLimit(body, MAX_API_PAGINATION_LIMIT)
    const orderInt = parseInt(body.order as string, 10)
    const order = isNaN(orderInt) ? 0 : Math.min(Math.max(orderInt, 0), Object.keys(PostOrder).length)

    // Fetch total posts
    const total = await fetchPostsCount()

    // Fetch posts
    const posts = await fetchPostInfos(false, offset, limit, order)

    // Send success
    ctx.apiSuccess({ posts, total })
}

/**
 * POST controller for post deletion
 * @param ctx The context
 * @param _next The next function
 */
export async function postDeletePosts(ctx: Context, _next: Next) {
    const body = ctx.request.body
    
    // Check for correct data
    if(isNaN(body.id) && !body.ids) {
        ctx.apiError('missing_params')
        return
    }

    // Parse data
    const idsRaw = body.id ? [body.id] : setToArray(body.ids)
    const ids: number[] = []
    for(const id of idsRaw)
        if(!isNaN(id))
            ids.push(id)

    // Delete posts
    await deletePostsAndDependentsByIds(ids)

    // Success
    ctx.apiSuccess()
}