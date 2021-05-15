const userModel = require('../models/user.model');
const postModel = require('../models/post.model');

/**
 * GET controller for blog page
 * @param {import("koa").Context} ctx The context
 */
module.exports.getBlog = async (ctx, next) => {
    // Fetch contributors
    ctx.state.contributors = await userModel.fetchContributors();
    // Fetch post
    ctx.state.posts = await postModel.fetchPostBySlug(ctx.params.slug);

    // TODO Fetch post and check for null (that it doesn't exist), and call next() to pass to not found
}