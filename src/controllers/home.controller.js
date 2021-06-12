const usersModel = require('../models/users.model')
const postsModel = require('../models/posts.model')
const paginationUtil = require('../utils/pagination.util')

/**
 * GET controller for homepage
 * @param {import("koa").Context} ctx The context
 */
module.exports.getHome = async ctx => {
    // Fetch total posts
    let totalPosts = await postsModel.fetchPostsCount()

    // Get pagination info
    let pagination = paginationUtil.paginatedRouteInfo(ctx, totalPosts)

    // Fetch posts
    ctx.state.posts = await postsModel.fetchPostInfos(pagination.queryOffset, pagination.queryLimit, postsModel.Order.CREATED_DESC)
    
    // Put pagination information
    ctx.state.pagination = pagination
}