const pagesModel = require('../models/pages.model')

/**
 * GET controller for user-created pages
 * @param {import("koa").Context} ctx The context
 * @param {Function} next
 */
module.exports.getPage = async (ctx, next) => {
    // Fetch page
    let pageRes = await pagesModel.fetchPageInfoBySlug(true, ctx.params.slug)

    // Check if page exists
    if(pageRes.length < 1) {
        // Not found
        ctx.state.noRender = true
        await next()
        return
    }

    const page = pageRes[0]

    // Page title
    ctx.state.pageTitle = page.title

    // Put context data
    ctx.state.page = page
}