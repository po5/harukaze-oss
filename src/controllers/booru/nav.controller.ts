import { Context, Next } from 'koa'
import { setToArray } from 'utils/misc.util'
import { fetchBooruVisibleMediaIdAfterOrBeforeId } from 'models/media.model'

/**
 * GET controller for booru item navigation
 * @param ctx The context
 * @param next The next function
 */
export async function getNav(ctx: Context, next: Next) {
	const id = parseInt(ctx.params.id, 10)

	// Just 404 if ID is invalid
	if(isNaN(id)) {
		await next()
		return
	}

	const query = ctx.request.query
	const to = query.to

	// Make sure valid location is given
	if(to !== 'before' && to !== 'after') {
		await next()
		return
	}

	// Collect data
	let tagsRaw = query.tags as string
	if(tagsRaw)
		tagsRaw = tagsRaw.replace(/ /g, ',')
	let tags: string[] = []
	if(tagsRaw)
		tags = setToArray(tagsRaw)
	const collection = parseInt(query.collection as string, 10)
	const user = query.user as string || null

	function destination(item: number) {
		let str = '/booru/item/'+item

		if(tags.length > 0 || !isNaN(collection) || user) {
			const parts: string[] = []
			if(tags.length > 0)
				parts.push('tags='+encodeURIComponent(tags.join('+')))
			if(!isNaN(collection))
				parts.push('collection='+collection)
			if(user)
				parts.push('user='+encodeURIComponent(user))
			str += '?'+parts.join('&')
		}

		return str
	}

	// Fetch destination
	const dest = await fetchBooruVisibleMediaIdAfterOrBeforeId(
		to === 'after',
		id,
		tags,
		isNaN(collection) ? null : collection,
		user
	)

	// If there is no destination, just redirect back to original page
	await ctx.redirect(destination(dest === null ? id : dest))
}