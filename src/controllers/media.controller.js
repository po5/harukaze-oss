const usersUtil = require('../utils/users.util')

/**
 * GET controller for media page
 * @param {import("koa").Context} ctx The context
 */
module.exports.getMedia = async (ctx, next) => {
    // Deal with unauthenticated and unauthorized users
    if(!ctx.state.authed) {
        ctx.state.noRender = true
        ctx.redirect('/login?next='+encodeURIComponent(ctx.path))
        return
    }

    // Check if user is a contributor
    if(ctx.state.user.role < usersUtil.Roles.CONTRIBUTOR) {
        ctx.state.noRender = true
        await next()
        return
    }
}