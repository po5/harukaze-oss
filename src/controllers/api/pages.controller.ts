import { Context, Next } from 'koa'
import { extractOffsetAndLimit } from 'utils/pagination.util'
import { MAX_API_PAGINATION_LIMIT } from 'root/constants'
import { deletePagesByIds, fetchPageCount, fetchPageInfoById, fetchPageInfos, PageOrder } from 'models/pages.model'
import { CommentType, deleteCommentsByPostIds } from 'models/comments.model'
import { setToArray } from 'utils/misc.util'
import { refreshLinkShownPages } from 'utils/pages.util'

/**
 * GET controller for page getting
 * @param ctx The context
 * @param _next The next function
 */
export async function getPage(ctx: Context, _next: Next) {
    const body = ctx.request.query

    // Check for ID
    const id = parseInt(body.id as string, 10)
    if(isNaN(id)) {
        ctx.apiError('missing_params')
        return
    }

    // Fetch page
    const [ page ] = await fetchPageInfoById(false, id)

    // Check if it exists
    if(!page) {
        ctx.apiError('not_found')
        return
    }

    ctx.apiSuccess({ page })
}

/**
 * GET controller for page listing
 * @param ctx The context
 * @param _next The next function
 */
export async function getPagesList(ctx: Context, _next: Next) {
    // Collect data
    const body = ctx.request.query
    const { offset, limit } = extractOffsetAndLimit(body, MAX_API_PAGINATION_LIMIT)
    const orderInt = parseInt(body.order as string, 10)
    const order = isNaN(orderInt) ? 0 : Math.min(Math.max(orderInt, 0), Object.keys(PageOrder).length)

    // Fetch total pages
    const total = await fetchPageCount()

    // Fetch pages
    const pages = await fetchPageInfos(false, offset, limit, order)

    // Send success
    ctx.apiSuccess({ pages, total })
}

/**
 * POST controller for page deletion
 * @param ctx The context
 * @param _next The next function
 */
export async function postDeletePages(ctx: Context, _next: Next) {
    const body = ctx.request.body
    
    // Check for correct data
    if(isNaN(body.id) && !body.ids) {
        ctx.apiError('missing_params')
        return
    }

    // Parse data
    const idsRaw = body.id ? [body.id] : setToArray(body.ids)
    const ids: number[] = []
    for(const id of idsRaw)
        if(!isNaN(id))
            ids.push(id)

    // Delete pages
    await deletePagesByIds(ids)

    // Delete comments on pages
    await deleteCommentsByPostIds(ids, CommentType.PAGE)

    // Refresh link-shown pages
    await refreshLinkShownPages()

    // Success
    ctx.apiSuccess()
}