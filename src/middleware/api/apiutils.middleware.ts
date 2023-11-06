import { Context, Next } from 'koa'

/**
 * Middleware that provides API utility methods
 * @param ctx The context
 * @param next The next function
 */
export async function apiUtilsMiddleware(ctx: Context, next: Next) {
    // Disable caching
    ctx.res.setHeader('Cache-control', 'no-store')
    ctx.res.setHeader('Pragma', 'no-cache')

    ctx.apiError = function(msg: string, extra: any = {}) {
        ctx.state.json = {
            status: 'error',
            error: msg,
            ...extra
        }
    }
    ctx.apiSuccess = function(extra: any = {}) {
        ctx.state.json = {
            status: 'success',
            ...extra
        }
    }

    await next()
}