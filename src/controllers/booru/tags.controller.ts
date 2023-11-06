import { Context, Next } from 'koa'
import { getMediaTags, getMediaTagsContaining, TagsAndUsages } from 'utils/tags.util'

/**
 * GET controller for tag listing and searching
 * @param ctx The context
 * @param _next The next function
 */
export async function getTags(ctx: Context, _next: Next) {
    const body = ctx.request.query
    const query = (body.query as string)?.trim()
    let offset: number | null = parseInt(body.offset as string, 10)
    if(isNaN(offset))
        offset = null
    let limit: number | null = parseInt(body.limit as string, 10)
    if(isNaN(limit))
        limit = null

    // Fetch tags
    const allTags = query ? getMediaTagsContaining(query) : getMediaTags()

    // Apply offset and limit
    let tags: TagsAndUsages
    if(offset || limit !== null) {
        const names = Object.keys(allTags)

        const start = offset || 0
        const end = limit === null ? names.length : start+limit

        tags = {}

        const part = names.slice(start, end)

        for(const tag of part)
            tags[tag] = allTags[tag]
    } else {
        tags = allTags
    }

    // Return them
    ctx.apiSuccess({ tags })
}