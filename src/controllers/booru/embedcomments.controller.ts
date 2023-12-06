import config from '../../../config.json'
import { Context, Next } from 'koa'
import { setToArray } from 'utils/misc.util'
import { fetchBooruVisibleMediaInfoById } from 'models/media.model'
import { getMediaTagUseCount, TagsAndUsages } from 'utils/tags.util'
import { fetchCollectionInfoById, fetchCollectionInfosWithMedia } from 'models/collections.model'

/**
 * GET controller for comments embed page
 * @param ctx The context
 * @param next The next function
 */
export async function getEmbedComments(ctx: Context, next: Next) {
    const id = parseInt(ctx.params.id, 10)

    // Validate ID
    if (isNaN(id)) {
        ctx.state.noRender = true
        await next()
        return
    }
    
    // Set page title
    ctx.state.pageTitle = 'Comments'

    // Put data
    ctx.state.itemId = id
    ctx.state.pageSize = config.pagination.pageSize
}
