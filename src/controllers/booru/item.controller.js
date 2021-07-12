const mediaModel = require('../../models/media.model')
const collectionsModel = require('../../models/collections.model')
const utils = require('../../utils/misc.util')

/**
 * GET controller for booru item page
 * @param {import("koa").Context} ctx The context
 */
module.exports.getItem = async (ctx, next) => {
    let id = ctx.params.id*1

    // Validate ID
    if(isNaN(id)) {
        ctx.state.noRender = true
        await next()
        return
    }
    
    // Parse tags
    let tagsRaw = ctx.request.query.tags
    if(tagsRaw)
        tagsRaw = tagsRaw.replace(/ /g, ',')
    let tags = []
    if(tagsRaw)
        tags = utils.setToArray(tagsRaw)

    // Fetch item
    let itemRes = await mediaModel.fetchBooruVisibleMediaInfoById(id)

    // Check if item exists
    if(itemRes.length < 1) {
        ctx.state.noRender = true
        await next()
        return
    }

    let item = itemRes[0]

    // Sort tags alphabetically
    item.tags.sort()

    // Check if collection is specified in query params
    if(!isNaN(ctx.query.collection)) {
        let colId = ctx.query.collection*1

        // Fetch collection
        let colRes = await collectionsModel.fetchCollectionInfoById(colId)

        // Check if it exists
        if(colRes.length > 0) {
            let collection = colRes[0]

            // Put collection into context
            ctx.state.collection = collection
        }
    } else {
        // Fetch collections this media is a part of, if any
        let collections = await collectionsModel.fetchCollectionInfosWithMedia(id)

        // Put collections into context
        ctx.state.collections = collections
    }
    
    // Set page title
    ctx.state.pageTitle = item.title

    // Put metadata if present
    if(item.comment)
        ctx.state.metaDescription = item.comment
    if(item.thumbnail_key)
        ctx.state.metaImage = '/assets/thumbnail/'+item.id

    // Put data
    ctx.state.item = item
    ctx.state.resultTags = item.tags
    ctx.state.queryTags = tags
}