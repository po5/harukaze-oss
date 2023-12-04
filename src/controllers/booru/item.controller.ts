import config from '../../../config.json'
import { Context, Next } from 'koa'
import { setToArray } from 'utils/misc.util'
import { fetchBooruVisibleMediaInfoById } from 'models/media.model'
import { getMediaTagUseCount, TagsAndUsages } from 'utils/tags.util'
import { fetchCollectionInfoById, fetchCollectionInfosWithMedia } from 'models/collections.model'

/**
 * GET controller for booru item page
 * @param ctx The context
 * @param next The next function
 */
export async function getItem(ctx: Context, next: Next) {
    const id = parseInt(ctx.params.id, 10)

    // Validate ID
    if(isNaN(id)) {
        ctx.state.noRender = true
        await next()
        return
    }
    
    // Parse tags
    let tagsRaw = ctx.request.query.tags as string | undefined
    if(tagsRaw)
        tagsRaw = tagsRaw.replace(/ /g, ',')
    let tags: string[] = []
    if(tagsRaw)
        tags = setToArray(tagsRaw)

    // Fetch item
    const item = await fetchBooruVisibleMediaInfoById(id)

    // Check if item exists
    if(item === null) {
        ctx.state.noRender = true
        await next()
        return
    }

    // Fetch tags from cache and find out how many items use them
    const resultTagNames = item.tags
    resultTagNames.sort()
    const resultTags: TagsAndUsages = {}
    for(const tag of resultTagNames)
        resultTags[tag] = Math.max(getMediaTagUseCount(tag), 1)

    // Sort tags alphabetically
    item.tags.sort()

    // Check if collection is specified in query params
    const colId = parseInt(ctx.query.collection as string, 10)
    if(!isNaN(colId)) {
        // Fetch collection
        const [ coll ] = await fetchCollectionInfoById(colId)

        // Check if it exists
        if(coll) {
            // Put collection into context
            ctx.state.collection = coll
        }
    } else {
        // Fetch collections this media is a part of, if any
        ctx.state.collections = await fetchCollectionInfosWithMedia(id, 0, Number.MAX_SAFE_INTEGER, 0)
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
    ctx.state.resultTags = resultTags
    ctx.state.queryTags = tags
    ctx.state.pageSize = config.pagination.pageSize
    ctx.state.nextUrl = `/booru/item/${id}/nav?${ctx.querystring}&to=before`
    ctx.state.prevUrl = `/booru/item/${id}/nav?${ctx.querystring}&to=after`
}