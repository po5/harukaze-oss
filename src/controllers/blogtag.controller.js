const postsModel = require('../models/posts.model')
const paginationUtil = require('../utils/pagination.util')

/**
 * GET controller for blog tag page
 * @param {import("koa").Context} ctx The context
 */
module.exports.getBlogTag = async ctx => {
    let tag = ctx.params.tag

    // Put tag in context
    ctx.state.tag = tag

    // Put title
    ctx.state.pageTitle = `Posts for tag "${tag}"`

    // Fetch total posts
    let totalPosts = await postsModel.fetchPublishedPostCountByTag(tag)

    // Check if there are any posts
    if(totalPosts > 0) {
        ctx.state.postsPresent = true

        // Get pagination info
        let pagination = paginationUtil.paginatedRouteInfo(ctx, totalPosts)

        // Fetch posts
        ctx.state.posts = await postsModel.fetchPublishedPostInfosByTag(tag, true, pagination.queryOffset, pagination.queryLimit, postsModel.Order.CREATED_DESC)
        
        // Put pagination information
        ctx.state.pagination = pagination
    } else {
        ctx.state.postsPresent = true

        // Nothing else to do
    }
}