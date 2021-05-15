const config = require('../../config.json');
const pageSize = config.pagination.pageSize;
const userModel = require('../models/user.model');
const postModel = require('../models/post.model');

/**
 * GET controller for homepage
 * @param {import("koa").Context} ctx The context
 */
module.exports.getHome = ctx => {
    let page = 0;

    // Get page from route param
    if(!isNaN(ctx.params.page))
        page = Math.max(1, ctx.params.page*1)-1

    // TODO Get total pages by getting total post count, and then divide that by page size, and finally put that into Math.ceil
    // TODO If page is higher than total pages, set page to highest page

    // Fetch contributors
    ctx.state.contributors = await userModel.fetchContributors();
    // Fetch posts
    ctx.state.posts = await postModel.fetchPosts(page*pageSize, pageSize);
}