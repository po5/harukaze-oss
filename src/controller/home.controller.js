const userModel = require('../models/user.model');
const postModel = require('../models/post.model');
const paginationUtil = require('../utils/pagination.util');

/**
 * GET controller for homepage
 * @param {import("koa").Context} ctx The context
 */
module.exports.getHome = async ctx => {
    // Fetch total posts
    let totalPosts = await postModel.fetchPostsCount();

    // Get pagination info
    let pagination = paginationUtil.paginatedRouteInfo(ctx, totalPosts);

    // Fetch contributors
    ctx.state.contributors = await userModel.fetchContributors();
    // Fetch posts
    ctx.state.posts = await postModel.fetchPosts(pagination.queryOffset, pagination.queryLimit);
    
    // Put pagination information
    ctx.state.pagination = pagination;
}