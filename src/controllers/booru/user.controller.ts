import { Context, Next } from 'koa'
import { fetchUserInfoByUsername } from 'models/users.model'
import {
    fetchBooruVisibleMediaCountByUploaderUsername,
    fetchBooruVisibleMediaInfosByUploaderUsername, MediaOrder
} from 'models/media.model'
import { paginatedRouteInfo } from 'utils/pagination.util'
import { getMediaTagUseCount, TagsAndUsages } from 'utils/tags.util'

/**
 * GET controller for booru user page
 * @param ctx The context
 * @param next The next function
 */
export async function getUser(ctx: Context, next: Next) {
    const username = ctx.params.username as string

    // Fetch user
    const [ user ] = await fetchUserInfoByUsername(username)

    // Check if user exists
    if(!user) {
        ctx.state.noRender = true
        await next()
        return
    }

    // Fetch total media by user
    const totalMedia = await fetchBooruVisibleMediaCountByUploaderUsername(username)

    // Get pagination info
    const pagination = paginatedRouteInfo(ctx, totalMedia, true)

    // Fetch media by user
    const media = await fetchBooruVisibleMediaInfosByUploaderUsername(username, pagination.queryOffset, pagination.queryLimit, MediaOrder.CREATED_DESC)

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
    
    // Set page title
    ctx.state.pageTitle = 'Items by '+user.username

    // Put metadata
    ctx.state.metaDescription = `View ${totalMedia} item${totalMedia === 1 ? '' : 's'} by ${username} on the booru`
    ctx.state.metaImage = '/assets/avatar/'+username

    // Put data
    ctx.state.user = user
    ctx.state.media = media
    ctx.state.resultTags = resultTags
    ctx.state.queryTags = []
}