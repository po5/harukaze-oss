import { Context, Next } from 'koa'
import {
    CommentOrder,
    deleteCommentsByAuthor,
    deleteCommentsByIds,
    fetchCommentInfoById,
    fetchCommentInfos,
    fetchCommentsCount
} from 'models/comments.model'
import { extractOffsetAndLimit } from 'utils/pagination.util'
import { MAX_API_PAGINATION_LIMIT } from 'root/constants'
import { setToArray } from 'utils/misc.util'

/**
 * GET controller for comment getting
 * @param ctx The context
 * @param _next The next function
 */
export async function getComment(ctx: Context, _next: Next) {
    const body = ctx.request.query

    // Check for ID
    const id = parseInt(body.id as string, 10)
    if(isNaN(id)) {
        ctx.apiError('missing_params')
        return
    }

    // Fetch comment
    const [ comment ] = await fetchCommentInfoById(id)

    // Check if it exists
    if(!comment) {
        ctx.apiError('not_found')
        return
    }

    ctx.apiSuccess({ comment })
}

/**
 * GET controller for comment listing
 * @param ctx The context
 * @param _next The next function
 */
export async function getCommentsList(ctx: Context, _next: Next) {
    // Collect data
    const body = ctx.request.query
    const { offset, limit } = extractOffsetAndLimit(body, MAX_API_PAGINATION_LIMIT)
    const orderInt = parseInt(body.order as string, 10)
    const order = isNaN(orderInt) ? 0 : Math.min(Math.max(orderInt, 0), Object.keys(CommentOrder).length)

    // Fetch total comments
    const total = await fetchCommentsCount()

    // Fetch comments
    const comments = await fetchCommentInfos(null, offset, limit, order)

    // Send success
    ctx.apiSuccess({ comments, total })
}

/**
 * POST controller for comment deletion
 * @param ctx The context
 * @param _next The next function
 */
export async function postDeleteComments(ctx: Context, _next: Next) {
    const body = ctx.request.body
    
    // Check for correct data
    if(isNaN(body.author) && isNaN(body.id) && !body.ids) {
        ctx.apiError('missing_params')
        return
    }

    if(!isNaN(body.author)) {
        // Parse author ID
        const author = parseInt(body.author, 10)

        // Delete comments
        await deleteCommentsByAuthor(author)
    } else {
        // Parse IDs
        const idsRaw = body.id ? [ body.id ] : setToArray(body.ids)
        const ids: number[] = []
        for(const id of idsRaw)
            if(!isNaN(id))
                ids.push(id)

        // Delete comments
        await deleteCommentsByIds(ids)
    }

    // Success
    ctx.apiSuccess()
}