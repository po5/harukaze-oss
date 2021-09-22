const collectionsModel = require('../../models/collections.model')
const mediaModel = require('../../models/media.model')
const paginationUtil = require('../../utils/pagination.util')
const tagsUtil = require('../../utils/tags.util')

/**
 * GET controller for booru collection page
 * @param {import("koa").Context} ctx The context
 * @param {Function} next
 */
module.exports.getCollection = async (ctx, next) => {
    let id = ctx.params.id*1

    // Validate ID
    if(isNaN(id)) {
        ctx.state.noRender = true
        await next()
        return
    }

    // Fetch collection
    let collectionRes = await collectionsModel.fetchCollectionInfoById(id)

    // Check if collection exists
    if(collectionRes.length < 1) {
        ctx.state.noRender = true
        await next()
        return
    }

    let collection = collectionRes[0]

    // Fetch total media in collection
    let totalMedia = await mediaModel.fetchBooruVisibleMediaCountByCollection(id)

    // Get pagination info
    let pagination = paginationUtil.paginatedRouteInfo(ctx, totalMedia, true)

    // Fetch media for collection
    let media = await mediaModel.fetchBooruVisibleMediaInfosByCollection(id, pagination.queryOffset, pagination.queryLimit, mediaModel.Order.CREATED_DESC)

    // Enumerate tags from items
    let resultTagNames = []
    let resultTags = {}
    for(let file of media)
        for(let tag of file.tags)
            if(!resultTagNames.includes(tag))
                resultTagNames.push(tag)
    resultTagNames.sort()
    for(let tag of resultTagNames)
        resultTags[tag] = Math.max(tagsUtil.getMediaTagUseCount(tag), 1)

    // Put pagination information
    ctx.state.pagination = pagination
    
    // Set page title
    ctx.state.pageTitle = `Items in collection "${collection.title}"`

    // Put metadata if present
    let itemCount = collection.items
    ctx.state.metaDescription = collection.comment ? collection.comment : `View ${itemCount} item${itemCount === 1 ? '' : 's'} in collection "${collection.title}" on the booru`
    if(collection.first_item != null)
        ctx.state.metaImage = '/assets/thumbnail/'+collection.first_item

    // Put data
    ctx.state.collection = collection
    ctx.state.media = media
    ctx.state.resultTags = resultTags
    ctx.state.queryTags = []
}