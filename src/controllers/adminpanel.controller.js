const usersUtil = require('../utils/users.util')

/**
 * GET controller for admin panel page
 * @param {import("koa").Context} ctx The context
 */
module.exports.getAdminPanel = async (ctx, next) => {
    // Deal with unauthenticated and unauthorized users
    if(!ctx.state.authed) {
        ctx.state.noRender = true
        ctx.redirect('/login?next='+encodeURIComponent(ctx.path))
        return
    }

    // Check if user is an admin
    if(ctx.state.user.role < usersUtil.Roles.ADMIN) {
        ctx.state.noRender = true
        await next()
        return
    }

    // Page title
    ctx.state.pageTitle = 'Administrator Panel'
}