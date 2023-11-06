import { Context, Next } from 'koa'
import { CollectionOrder, fetchCollectionInfos, fetchCollectionsCount } from 'models/collections.model'
import { paginatedRouteInfo } from 'utils/pagination.util'

/**
 * GET controller for booru collections page
 * @param ctx The context
 * @param _next The next function
 */
export async function getCollections(ctx: Context, _next: Next) {
    // Set page title
    ctx.state.pageTitle = 'Collections'

    // Fetch total collections
    const totalCollections = await fetchCollectionsCount()

    // Get pagination info
    const pagination = paginatedRouteInfo(ctx, totalCollections, true)

    // Fetch collections
    const collections = await fetchCollectionInfos(pagination.queryOffset, pagination.queryLimit, CollectionOrder.CREATED_DESC)
    
    // Put pagination information
    ctx.state.pagination = pagination

    // Put metadata
    ctx.state.metaDescription = `View ${totalCollections} collection${totalCollections === 1 ? '' : 's'} of items on the booru`

    // Put data
    ctx.state.collections = collections
    ctx.state.queryTags = []
}