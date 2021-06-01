const usersModel = require('../models/users.model')
const postsModel = require('../models/posts.model')

/**
 * GET controller for blog page
 * @param {import("koa").Context} ctx The context
 */
module.exports.getBlog = async (ctx, next) => {
    // Fetch contributors
    ctx.state.contributors = await usersModel.fetchContributorInfos(0, 100)
    
    // Fetch post
    let postRes = await postsModel.fetchPostBySlug(ctx.params.slug)
    
    if(postRes.length > 0) {
        ctx.state.post = postRes[0]
    } else {
        // TODO Handle 404
    }
}