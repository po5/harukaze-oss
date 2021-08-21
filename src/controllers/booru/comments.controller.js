const commentsModel = require('../../models/comments.model')
const mediaModel = require('../../models/media.model')
const { Roles } = require('../../utils/users.util')
const moodUtils = require('../../utils/moods.util')

/**
 * GET controller for returning booru comments
 * @param {import("koa").Context} ctx The context
 */
module.exports.getComments = async ctx => {
    let body = ctx.request.query

    // Collect data
    const id = body.id*1
    const offset = isNaN(body.offset) ? 0 : Math.max(body.offset*1, 0)
    const limit = isNaN(body.limit) ? 50 : Math.min(Math.max(body.limit*1, 0), 50)
    const order = isNaN(body.order) ? 0 : Math.min(Math.max(body.order*1, 0), Object.keys(commentsModel.Order).length)

    // Check ID validity
    if(!isNaN(body.id)) {
        // Check if booru post exists
        const mediaRes = await mediaModel.fetchBooruVisibleMediaInfoById(id)

        if(mediaRes.length > 0) {
            // Fetch total comments
            let total = await commentsModel.fetchNormalCommentsCountByPost(id, commentsModel.Type.BOORU)

            // Fetch comments
            let comments = await commentsModel.fetchNormalCommentInfosByPost(id, commentsModel.Type.BOORU, offset, limit, order)

            // Fetch replies
            let commentIds = new Array(comments.length)
            for(let i in comments)
                commentIds[i] = comments[i].id
            let replies = await commentsModel.fetchReplyCommentsByParentIds(commentIds)

            // Attach replies to comments
            for(let comment of comments)
                comment.replies = []
            for(let reply of replies) {
                // Find parent and add reply
                for(let comment of comments) {
                    if(comment.id === reply.parent) {
                        comment.replies.push(reply)
                        break
                    }
                }
            }

            // Send success
            ctx.apiSuccess({ comments, total })
        } else {
            ctx.apiError('invalid_id')
        }
    } else {
        ctx.apiError('invalid_id')
    }
}

/**
 * POST controller for booru comment creation
 * @param {import('koa').Context} ctx The context
 */
module.exports.postCreateComment = async ctx => {
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
    const mood = await moodUtils.getMoodById(body.mood*1)
    const id = body.id*1
    const parent = isNaN(body.parent) ? null : body.parent*1

    // Check if parent comment exists
    if(parent !== null && (await commentsModel.fetchCommentInfoById(parent)).length < 1) {
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

    // Check if item exists
    if((await mediaModel.fetchBooruVisibleMediaInfoById(id)).length < 1) {
        ctx.apiError('invalid_item_id')
        return
    }

    // Create comment
    await commentsModel.createComment(id, parent, user.id, content, mood.id, commentsModel.Type.BOORU)

    // Success
    ctx.apiSuccess()
}

/**
 * POST controller for booru comment deletion
 * @param {import('koa').Context} ctx The context
 */
module.exports.postDeleteComment = async ctx => {
    // Make sure user is logged in
    if(!ctx.state.authed) {
        ctx.status = 403
        return
    }

    const user = ctx.state.user
    const body = ctx.request.body

    // Collect data
    const id = body.id*1

    // Make sure it's valid
    if(isNaN(id)) {
        ctx.apiError('invalid_id')
        return
    }

    // Check if comment exists
    const commentRes = await commentsModel.fetchCommentInfoById(id)
    if(commentRes.length < 1) {
        ctx.apiError('invalid_id')
        return
    }

    const comment = commentRes[0]

    // Check for permission
    if(user.id !== comment.author && user.role < Roles.ADMIN) {
        ctx.status = 403
        return
    }

    // Delete comment
    await commentsModel.deleteCommentById(id)

    // Delete its children if a top-level comment
    if(comment.parent == null)
        await commentsModel.deleteCommentsByParent(id)

    // Success
    ctx.apiSuccess()
}