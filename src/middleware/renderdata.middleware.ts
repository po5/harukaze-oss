import { Context, Next } from 'koa';
import { putEssentialState } from 'utils/render.util';

/**
 * Middleware that fetches data required for rendering pages
 * @param ctx The context
 * @param next The next function
 */
export async function renderDataMiddleware(ctx: Context, next: Next) {
    // Put essential context data
    await putEssentialState(ctx, true)

    await next()
}