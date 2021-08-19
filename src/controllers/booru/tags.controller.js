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
    let offset = body.offset*1
    if(isNaN(offset))
        offset = null
    let limit = body.limit*1
    if(isNaN(limit))
        limit = null

    // Fetch tags
    let allTags = query ? tagsUtil.getTagsContaining(query) : tagsUtil.getTags()

    // Apply offset and limit
    let tags
    if(offset || limit !== null) {
        let names = Object.keys(allTags)

        let start = offset || 0
        let end = limit === null ? names.length : offset + limit

        tags = {}

        let part = names.slice(start, end)

        for(let tag of part)
            tags[tag] = allTags[tag]
    } else {
        tags = allTags
    }

    // Return them
    ctx.apiSuccess({ tags })
}