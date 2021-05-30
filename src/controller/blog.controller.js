const userModel = require('../models/user.model')
const postModel = require('../models/post.model')

/**
 * GET controller for blog page
 * @param {import("koa").Context} ctx The context
 */
module.exports.getBlog = async (ctx, next) => {
    // Fetch contributors
    ctx.state.contributors = await userModel.fetchContributors()
    // Fetch post
    ctx.state.post = await postModel.fetchPostBySlug(ctx.params.slug)
    console.log(ctx.state.post)
    if(ctx.state.post == null) {
        // handle 404
    }
}