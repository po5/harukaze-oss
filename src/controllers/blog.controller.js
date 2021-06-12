const usersModel = require('../models/users.model')
const postsModel = require('../models/posts.model')

/**
 * GET controller for blog page
 * @param {import("koa").Context} ctx The context
 */
module.exports.getBlog = async (ctx, next) => {
    // Fetch post
    let postRes = await postsModel.fetchPostInfoBySlug(ctx.params.slug)
    
    if(postRes.length > 0) {
        let post = postRes[0]

        ctx.state.post = post
    } else {
        // Not found
        ctx.state.noRender = true
        await next()
    }
}