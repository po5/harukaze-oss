const pagesModel = require('../models/pages.model')

let _linkShownPages = []

/**
 * Refreshes all link-shown pages
 */
async function refreshLinkShownPages() {
	// Fetch all link-shown pages
	_linkShownPages = await pagesModel.fetchLinkShownPageInfos(false, 0, 999, pagesModel.Order.TITLE_ASC)
}

/**
 * Returns all link-shown pages
 * @returns {Object} All link-shown pages
 */
function getLinkShownPages() {
	return _linkShownPages
}

/* Export functions */
module.exports.refreshLinkShownPages = refreshLinkShownPages
module.exports.getLinkShownPages = getLinkShownPages