/**
 * Renders an API response
 * @param {import('koa').Context} ctx The context to render with
 */
function apiRes(ctx) {
	if(!ctx.state.noRender)
		ctx.body = ctx.state.json || { status: 'success' }
}

/**
 * Modifies a context to show an API error
 * @param {import('koa').Context} ctx The context to modify
 * @param {Error} err The error to handle
 */
function apiError(ctx, err) {
	console.error('Error occurred while handling API request:')
	console.error(err)
	ctx.status = 500
	ctx.state.noRender = false
	ctx.state.json = { status: 'internal_error' }
}

/* Export functions */
module.exports.apiRes = apiRes
module.exports.apiError = apiError