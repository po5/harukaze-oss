const postsModel = require('../models/posts.model')
const usersModel = require('../models/users.model')
const paginationUtil = require('../utils/pagination.util')
const config = require('../../config.json')

/**
 * GET controller for blog listing by username
 * @param {import("koa").Context} ctx The context
 * @param {Function} next
 */
module.exports.getBlogsBy = async (ctx, next) => {
    const username = ctx.params.username

    // Fetch user
    const userRes = await usersModel.fetchUserInfoByUsername(username)

    // Check if it exists
    if(userRes.length < 1) {
        ctx.state.noRender = true
        await next()
        return
    }

    const user = userRes[0]

    // Set username in page context
    ctx.state.username = user.username

    // Get results count
    let totalPosts = await postsModel.fetchPublishedPostCountByAuthor(user.id)
    ctx.state.totalPosts = totalPosts

    // Meta image
    ctx.state.metaImage = '/assets/avatar/'+user.username
    // Meta description
    ctx.state.metaDescription = `View all posts by ${user.username}`

    // Only fetch posts if count is more than 0
    if(totalPosts > 0) {
        // Get pagination info
        let pagination = paginationUtil.paginatedRouteInfo(ctx, totalPosts)

        // Fetch posts
        let posts = await postsModel.fetchPublishedPostInfosByAuthor(user.id, true, pagination.queryOffset, pagination.queryLimit, postsModel.Order.CREATED_DESC)

        // Put data into context
        ctx.state.pagination = pagination
        ctx.state.posts = posts
    } else {
        // Empty posts
        ctx.state.posts = []
    }
}