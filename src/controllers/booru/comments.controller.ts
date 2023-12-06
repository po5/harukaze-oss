import { Context, Next } from 'koa'
import {
    CommentInfo,
    CommentOrder,
    CommentType, createComment, deleteCommentById, fetchCommentInfoById,
    fetchNormalCommentInfosByPost,
    fetchNormalCommentsCountByPost, fetchReplyCommentsByParentIds
} from 'models/comments.model'
import { fetchBooruVisibleMediaInfoById } from 'models/media.model'
import { getMoodById } from 'utils/moods.util'
import { UserRoles } from 'utils/users.util'
import { appSzurubooruClient } from 'utils/szurubooru.util'

/**
 * GET controller for returning booru comments
 * @param ctx The context
 * @param _next The next function
 */
export async function getComments(ctx: Context, _next: Next) {
    const body = ctx.request.query

    // Collect data
    const id = parseInt(body.id as string, 10)
    const offsetInt = parseInt(body.offset as string, 10);
    const offset = isNaN(offsetInt) ? 0 : Math.max(offsetInt, 0)
    const limitInt = parseInt(body.limit as string, 10)
    const limit = isNaN(limitInt) ? 50 : Math.min(Math.max(limitInt, 0), 50)
    const orderInt = parseInt(body.order as string, 10)
    const order = isNaN(orderInt) ? 0 : Math.min(Math.max(orderInt, 0), Object.keys(CommentOrder).length)

    // Check ID validity
    if (isNaN(id)) {
        ctx.apiError('invalid_id')
        return
    }

    // Check if booru post exists, unless szurubooru is present
    if (appSzurubooruClient === null) {
        const media = await fetchBooruVisibleMediaInfoById(id)

        if(media === null) {
            ctx.apiError('invalid_id')
            return
        }
    }

    // Fetch total comments
    const total = await fetchNormalCommentsCountByPost(id, CommentType.BOORU)

    // Fetch comments
    const comments: (CommentInfo & { replies: CommentInfo[] })[] = await fetchNormalCommentInfosByPost(id, CommentType.BOORU, offset, limit, order) as any[]

    // Fetch replies
    const commentIds = new Array(comments.length)
    for(let i = 0; i < comments.length; i++)
        commentIds[i] = comments[i].id
    const replies = await fetchReplyCommentsByParentIds(commentIds)

    // Attach replies to comments
    for(const comment of comments)
        comment.replies = []
    for(const reply of replies) {
        // Find parent and add reply
        for(const comment of comments) {
            if(comment.id === reply.parent) {
                comment.replies.push(reply)
                break
            }
        }
    }

    // Send success
    ctx.apiSuccess({ comments, total })
}

/**
 * POST controller for booru comment creation
 * @param ctx The context
 * @param _next The next function
 */
export async function postCreateComment(ctx: Context, _next: Next) {
    // Make sure user is logged in
    if(!ctx.state.authed) {
        ctx.status = 403
        return
    }

    const user = ctx.state.user
    const body = ctx.request.body

    // Check for data
    if(!body.content || isNaN(body.mood) || isNaN(body.id)) {
        ctx.apiError('missing_params')
        return
    }

    const content = body.content.trim()
    const mood = await getMoodById(parseInt(body.mood, 10))
    const id = parseInt(body.id, 10)
    const parentInt = parseInt(body.parent, 10)
    const parent = isNaN(parentInt) ? null : parentInt

    // Check if parent comment exists
    if(parent !== null && (await fetchCommentInfoById(parent)).length < 1) {
        ctx.apiError('invalid_parent_id')
        return
    }

    // Make sure mood is valid
    if(!mood) {
        ctx.apiError('invalid_mood_id')
        return
    }

    // Make sure content is not blank
    if(!content) {
        ctx.apiError('blank_content')
        return
    }

    // Check if item exists, unless szurubooru is enabled
    if (appSzurubooruClient === null) {
        if(await fetchBooruVisibleMediaInfoById(id) === null) {
            ctx.apiError('invalid_item_id')
            return
        }
    }

    // Create comment
    await createComment(id, parent, user.id, content, mood.id, CommentType.BOORU)

    // Success
    ctx.apiSuccess()
}

/**
 * POST controller for booru comment deletion
 * @param ctx The context
 * @param _next The next function
 */
export async function postDeleteComment(ctx: Context, _next: Next) {
    // Make sure user is logged in
    if(!ctx.state.authed) {
        ctx.status = 403
        return
    }

    const user = ctx.state.user
    const body = ctx.request.body

    // Collect data
    const id = parseInt(body.id, 10)

    // Make sure it's valid
    if (isNaN(id)) {
        ctx.apiError('invalid_id')
        return
    }

    // Check if comment exists
    const [ comment ] = await fetchCommentInfoById(id)
    if (!comment) {
        ctx.apiError('invalid_id')
        return
    }

    // Check for permission
    if (user.id !== comment.author && user.role < UserRoles.ADMIN) {
        ctx.status = 403
        return
    }

    await deleteCommentById(id)

    // Success
    ctx.apiSuccess()
}
