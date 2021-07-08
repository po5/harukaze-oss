const collectionsModel = require('../../models/collections.model')
const paginationUtil = require('../../utils/pagination.util')
const utils = require('../../utils/misc.util')

/**
 * GET controller for booru collections page
 * @param {import("koa").Context} ctx The context
 */
module.exports.getCollections = async ctx => {
    // Set page title
    ctx.state.pageTitle = 'Collections'

    // Fetch total collections
    let totalCollections = await collectionsModel.fetchCollectionsCount()

    // Get pagination info
    let pagination = paginationUtil.paginatedRouteInfo(ctx, totalCollections, true)

    // Fetch collections
    let collections = await collectionsModel.fetchCollectionInfos(pagination.queryOffset, pagination.queryLimit, collectionsModel.Order.CREATED_DESC)
    
    // Put pagination information
    ctx.state.pagination = pagination

    // Put metadata
    ctx.state.metaDescription = `View ${totalCollections} collection${totalCollections == 1 ? '' : 's'} of items on the booru`

    // Put data
    ctx.state.collections = collections
    ctx.state.queryTags = []
}