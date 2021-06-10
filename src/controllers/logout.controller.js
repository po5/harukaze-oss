/**
 * GET controller for log out page
 * @param {import("koa").Context} ctx The context
 */
module.exports.getLogout = async ctx => {
    // Figure out where to go next
    let next = ctx.request.query.next ? ctx.request.query.next : '/'
    if(next == '/' && ctx.request.header.referer)
        next = ctx.request.header.referer
    ctx.state.next = next

    // Remove user ID from session
    delete ctx.session.id

    // Redirect
    ctx.redirect(next)
}