/**
 * Middleware that provides API utility methods
 * @param {import("koa").Context} ctx The context
 * @param {Function} next The next route to call
 */
module.exports = async (ctx, next) => {
    // Disable caching
    ctx.res.setHeader('Cache-control', 'no-store')
    ctx.res.setHeader('Pragma', 'no-cache')

    ctx.apiError = function(msg, extra = {}) {
        ctx.state.json = {
            status: 'error',
            error: msg,
            ...extra
        }
    }
    ctx.apiSuccess = function(extra = {}) {
        ctx.state.json = {
            status: 'success',
            ...extra
        }
    }

    await next()
}