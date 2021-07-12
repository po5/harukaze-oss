const tagsUtil = require('../../utils/tags.util')

/**
 * GET controller for tag listing and searching
 * @param {import('koa').Context} ctx 
 */
module.exports.getTags = async ctx => {
    let body = ctx.request.query
    let query = body.query
    if(query)
        query = query.trim()

    // Fetch tags
    let tags = query ? tagsUtil.getTagsContaining(query) : tagsUtil.getTags()

    // Return them
    ctx.body = {
        status: 'success',
        tags
    }
}