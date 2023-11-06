import { Context } from 'koa'

/**
 * Renders an API response
 * @param ctx The context to render with
 */
export function apiRes(ctx: Context) {
	if(!ctx.state.noRender)
		ctx.body = ctx.state.json || { status: 'success' }
}

/**
 * Modifies a context to show an API error
 * @param ctx The context to modify
 * @param err The error to handle
 */
export function apiError(ctx: Context, err: Error) {
	console.error('Error occurred while handling API request:')
	console.error(err)
	ctx.status = 500
	ctx.state.noRender = false
	ctx.state.json = { status: 'internal_error' }
}