const usersUtil = require('../utils/users.util')
const config = require('../../config.json')

/**
 * GET controller for media manager page
 * @param {import("koa").Context} ctx The context
 */
module.exports.getMediaManager = async (ctx, next) => {
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

    // Page title
    ctx.state.pageTitle = 'Media Manager'
    ctx.state.maxUploadSize = config.site.maxUploadSize
}