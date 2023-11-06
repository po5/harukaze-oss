import { Context, Next } from 'koa'
import { fetchCollectionInfoById } from 'models/collections.model'
import {
    fetchBooruVisibleMediaCountByCollection,
    fetchBooruVisibleMediaInfosByCollection,
    MediaOrder
} from 'models/media.model'
import { paginatedRouteInfo } from 'utils/pagination.util'
import { getMediaTagUseCount, TagsAndUsages } from 'utils/tags.util'

/**
 * GET controller for booru collection page
 * @param ctx The context
 * @param next The next function
 */
export async function getCollection(ctx: Context, next: Next) {
    const id = parseInt(ctx.params.id, 10)

    // Validate ID
    if(isNaN(id)) {
        ctx.state.noRender = true
        await next()
        return
    }

    // Fetch collection
    const [ collection ] = await fetchCollectionInfoById(id)

    // Check if collection exists
    if(!collection) {
        ctx.state.noRender = true
        await next()
        return
    }

    // Fetch total media in collection
    const totalMedia = await fetchBooruVisibleMediaCountByCollection(id)

    // Get pagination info
    const pagination = paginatedRouteInfo(ctx, totalMedia, true)

    // Fetch media for collection
    const media = await fetchBooruVisibleMediaInfosByCollection(id, pagination.queryOffset, pagination.queryLimit, MediaOrder.CREATED_DESC)

    // Enumerate tags from items
    const resultTagNames: string[] = []
    const resultTags: TagsAndUsages = {}
    for(const file of media)
        for(const tag of file.tags)
            if(!resultTagNames.includes(tag))
                resultTagNames.push(tag)
    resultTagNames.sort()
    for(const tag of resultTagNames)
        resultTags[tag] = Math.max(getMediaTagUseCount(tag), 1)

    // Put pagination information
    ctx.state.pagination = pagination
    
    // Set page title
    ctx.state.pageTitle = `Items in collection "${collection.title}"`

    // Put metadata if present
    const itemCount = collection.items
    ctx.state.metaDescription = collection.comment ? collection.comment : `View ${itemCount} item${itemCount === 1 ? '' : 's'} in collection "${collection.title}" on the booru`
    if(collection.first_item !== null)
        ctx.state.metaImage = '/assets/thumbnail/'+collection.first_item

    // Put data
    ctx.state.collection = collection
    ctx.state.media = media
    ctx.state.resultTags = resultTags
    ctx.state.queryTags = []
}