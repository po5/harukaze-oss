const pagesModel = require('../../models/pages.model')
const commentsModel = require('../../models/comments.model')
const utils = require('../../utils/misc.util')
const { refreshLinkShownPages } = require('../../utils/pages.util')

/**
 * GET controller for page getting
 * @param {import('koa').Context} ctx 
 */
module.exports.getPage = async ctx => {
    let body = ctx.request.query

    // Check for ID
    if(!isNaN(body.id)) {
        let id = body.id*1

        // Fetch page
        let pageRes = await pagesModel.fetchPageInfoById(false, id)

        // Check if it exists
        if(pageRes.length > 0) {
            let page = pageRes[0]

            ctx.apiSuccess({ page })
        } else {
            ctx.apiError('not_found')
        }
    } else {
        ctx.apiError('missing_params')
    }
}

/**
 * GET controller for page listing
 * @param {import("koa").Context} ctx The context
 */
module.exports.getPagesList = async ctx => {
    // Collect data
    let body = ctx.request.query
    let offset = isNaN(body.offset) ? 0 : Math.max(body.offset*1, 0)
    let limit = isNaN(body.limit) ? 50 : Math.min(Math.max(body.limit*1, 0), 50)
    let order = isNaN(body.order) ? 0 : Math.min(Math.max(body.order*1, 0), Object.keys(pagesModel.Order).length)

    // Fetch total pages
    let total = await pagesModel.fetchPageCount()

    // Fetch pages
    let pages = await pagesModel.fetchPageInfos(false, offset, limit, order)

    // Send success
    ctx.apiSuccess({ pages, total })
}

/**
 * POST controller for page deletion
 * @param {import('koa').Context} ctx The context
 */
module.exports.postDeletePages = async ctx => {
    let body = ctx.request.body
    
    // Check for correct data
    if(!isNaN(body.id) || body.ids) {
        // Parse data
        let idsRaw = body.id ? [body.id] : utils.setToArray(body.ids)
        let ids = []
        for(id of idsRaw)
            if(!isNaN(id))
                ids.push(id)

        // Delete pages
        await pagesModel.deletePagesByIds(ids)

        // Delete comments on pages
        await commentsModel.deleteCommentsByPostIds(ids, commentsModel.Type.PAGE)

        // Refresh link-shown pages
        await refreshLinkShownPages()

        // Success
        ctx.apiSuccess()
    } else {
        ctx.apiError('missing_params')
    }
}