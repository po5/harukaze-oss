const commentsModel = require('../../models/comments.model')
const utils = require('../../utils/misc.util')

/**
 * GET controller for comment getting
 * @param {import('koa').Context} ctx 
 */
module.exports.getComment = async ctx => {
    let body = ctx.request.query

    // Check for ID
    if(!isNaN(body.id)) {
        let id = body.id*1

        // Fetch comment
        let commentRes = await commentsModel.fetchCommentInfoById(id)

        // Check if it exists
        if(commentRes.length > 0) {
            let comment = commentRes[0]

            ctx.apiSuccess({ comment })
        } else {
            ctx.apiError('not_found')
        }
    } else {
        ctx.apiError('missing_params')
    }
}

/**
 * GET controller for comment listing
 * @param {import("koa").Context} ctx The context
 */
module.exports.getCommentsList = async ctx => {
    // Collect data
    let body = ctx.request.query
    let offset = isNaN(body.offset) ? 0 : Math.max(body.offset*1, 0)
    let limit = isNaN(body.limit) ? 50 : Math.min(Math.max(body.limit*1, 0), 50)
    let order = isNaN(body.order) ? 0 : Math.min(Math.max(body.order*1, 0), Object.keys(commentsModel.Order).length)

    // Fetch total comments
    let total = await commentsModel.fetchCommentsCount()

    // Fetch comments
    let comments = await commentsModel.fetchCommentInfos(offset, limit, order)

    // Send success
    ctx.apiSuccess({ comments, total })
}

/**
 * POST controller for comment deletion
 * @param {import('koa').Context} ctx The context
 */
module.exports.postDeleteComments = async ctx => {
    let body = ctx.request.body
    
    // Check for correct data
    if(!isNaN(body.author) || !isNaN(body.id) || body.ids) {
        if(!isNaN(body.author)) {
            // Parse author ID
            let author = body.author*1

            // Delete comments
            await commentsModel.deleteCommentsByAuthor(author)
        } else {
            // Parse IDs
            let idsRaw = body.id ? [body.id] : utils.setToArray(body.ids)
            let ids = []
            for(id of idsRaw)
                if(!isNaN(id))
                    ids.push(id)

            // Delete comments
            await commentsModel.deleteCommentsByIds(ids)
        }

        // Success
        ctx.apiSuccess()
    } else {
        ctx.apiError('missing_params')
    }
}