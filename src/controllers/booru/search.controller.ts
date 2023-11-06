import { Context, Next } from 'koa'
import { fetchBooruVisibleMediaCountByTags, fetchBooruVisibleMediaInfosByTags, MediaOrder } from 'models/media.model'
import { paginatedRouteInfo } from 'utils/pagination.util'
import { getMediaTagUseCount, TagsAndUsages } from 'utils/tags.util'
import { englishPlural as s, setToArray } from 'utils/misc.util'

/**
 * GET controller for booru tag search
 * @param ctx The context
 * @param _next The next function
 */
export async function getSearch(ctx: Context, _next: Next) {
    // Parse tags
    let tagsRaw = ctx.request.query.query as string
    if(tagsRaw)
        tagsRaw = tagsRaw.replace(/ /g, ',')
    let tags: string[] = []
    if(tagsRaw)
        tags = setToArray(tagsRaw)
    
    // Set page title
    ctx.state.pageTitle = tags.length > 0 ? 'Tag Search - '+tags.join(' ') : 'Tag Search'

    // Fetch total media
    const totalMedia = await fetchBooruVisibleMediaCountByTags(tags)

    // Get pagination info
    const pagination = paginatedRouteInfo(ctx, totalMedia, true)

    // Fetch media
    const media = await fetchBooruVisibleMediaInfosByTags(tags, pagination.queryOffset, pagination.queryLimit, MediaOrder.CREATED_DESC)

    // Enumerate tags from items
    const resultTagNames: string[] = []
    const resultTags: TagsAndUsages = {}
    for(const file of media)
        for(const tag of file.tags)
            if(!resultTagNames.includes(tag))
                resultTagNames.push(tag)

    // Sort tags alphabetically
    resultTagNames.sort()
    for(const tag of resultTagNames)
        resultTags[tag] = Math.max(getMediaTagUseCount(tag), 1)
    
    // Put pagination information
    ctx.state.pagination = pagination

    // Put metadata if present
    ctx.state.metaDescription = tags.length > 0
        ? `View ${totalMedia} result${s(totalMedia)} for the tag${s(tags.length)} "${tags.join(' ')}" on the booru`
        : `View all ${totalMedia} item${s(totalMedia)} on the booru`

    // Put data
    ctx.state.media = media
    ctx.state.resultTags = resultTags
    ctx.state.queryTags = tags
}
