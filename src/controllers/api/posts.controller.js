const postsModel = require('../../models/posts.model')
const commentsModel = require('../../models/comments.model')
const utils = require('../../utils/misc.util')

/**
 * GET controller for post getting
 * @param {import('koa').Context} ctx 
 */
module.exports.getPost = async ctx => {
    let body = ctx.request.query

    // Check for ID
    if(!isNaN(body.id)) {
        let id = body.id*1

        // Fetch post
        let postRes = await postsModel.fetchPostInfoById(false, id)

        // Check if it exists
        if(postRes.length > 0) {
            let post = postRes[0]

            ctx.apiSuccess({ post })
        } else {
            ctx.apiError('not_found')
        }
    } else {
        ctx.apiError('missing_params')
    }
}

/**
 * GET controller for post listing
 * @param {import("koa").Context} ctx The context
 */
module.exports.getPostsList = async ctx => {
    // Collect data
    let body = ctx.request.query
    let offset = isNaN(body.offset) ? 0 : Math.max(body.offset*1, 0)
    let limit = isNaN(body.limit) ? 50 : Math.min(Math.max(body.limit*1, 0), 50)
    let order = isNaN(body.order) ? 0 : Math.min(Math.max(body.order*1, 0), Object.keys(postsModel.Order).length)

    // Fetch total posts
    let total = await postsModel.fetchPostsCount()

    // Fetch posts
    let posts = await postsModel.fetchPostInfos(false, offset, limit, order)

    // Send success
    ctx.apiSuccess({ posts, total })
}

/**
 * POST controller for post deletion
 * @param {import('koa').Context} ctx The context
 */
module.exports.postDeletePosts = async ctx => {
    let body = ctx.request.body
    
    // Check for correct data
    if(!isNaN(body.id) || body.ids) {
        // Parse data
        let idsRaw = body.id ? [body.id] : utils.setToArray(body.ids)
        let ids = []
        for(id of idsRaw)
            if(!isNaN(id))
                ids.push(id)

        // Delete posts
        await postsModel.deletePostsByIds(ids)

        // Delete comments on posts
        await commentsModel.deleteCommentsByPostIds(ids, commentsModel.Type.POST)

        // Success
        ctx.apiSuccess()
    } else {
        ctx.apiError('missing_params')
    }
}