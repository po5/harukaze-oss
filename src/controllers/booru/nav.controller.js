const collectionsModel = require('../../models/collections.model')
const mediaModel = require('../../models/media.model')
const usersUtil = require('../../utils/users.util')
const utils = require('../../utils/misc.util')

/**
 * GET controller for booru item navigation
 * @param {import("koa").Context} ctx The context
 * @param {Function} next
 */
module.exports.getNav = async (ctx, next) => {
	const id = ctx.params.id*1

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
	let tagsRaw = query.tags
	if(tagsRaw)
		tagsRaw = tagsRaw.replace(/ /g, ',')
	let tags = []
	if(tagsRaw)
		tags = utils.setToArray(tagsRaw)
	const collection = query.collection*1
	const user = query.user*1

	function destination(item) {
		let str = '/booru/item/'+item

		if(tags.length > 0 || !isNaN(collection) || user) {
			let parts = []
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
	const dest = await mediaModel.fetchBooruVisibleMediaIdAfterOrBeforeId(to === 'after', id, tags, collection, user)

	// If there is no destination, just redirect back to original page
	await ctx.redirect(destination(dest === null ? id : dest))
}