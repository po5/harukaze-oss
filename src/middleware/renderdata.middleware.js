const { putEssentialState } = require('../utils/render.util')

/**
 * Middleware that fetches data required for rendering pages
 * @param {import("koa").Context} ctx The context
 */
module.exports = async (ctx, next) => {
    // Put essential context data
    await putEssentialState(ctx, true)

    await next()
}