const postsModel = require('../models/posts.model')
const paginationUtil = require('../utils/pagination.util')
const tagsUtil = require('../utils/tags.util')

/**
 * GET controller for blog search page
 * @param {import("koa").Context} ctx The context
 */
module.exports.getBlogSearch = async ctx => {
    const query = ctx.query.query

    // Fetch blog tags
    const tags = tagsUtil.getPostTags()
    ctx.state.tags = tags

    // Search if query is preset
    if(query) {
        ctx.state.query = query
        ctx.state.showForm = false

        // Work out search pattern
        let pattern = '%'+query.replace(/%/g, '|%')+'%'

        // Get results count
        let totalPosts = await postsModel.fetchPublishedPostCountWherePostLike(pattern)
        ctx.state.totalPosts = totalPosts

        // Only fetch posts if count is more than 0
        if(totalPosts > 0) {
            // Get pagination info
            let pagination = paginationUtil.paginatedRouteInfo(ctx, totalPosts)

            // Fetch posts
            let posts = await postsModel.fetchPublishedPostInfosWherePostLike(pattern, true, pagination.queryOffset, pagination.queryLimit, postsModel.Order.CREATED_DESC)

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