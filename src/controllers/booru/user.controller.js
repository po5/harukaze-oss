const usersModel = require('../../models/users.model')
const mediaModel = require('../../models/media.model')
const paginationUtil = require('../../utils/pagination.util')

/**
 * GET controller for booru user page
 * @param {import("koa").Context} ctx The context
 */
module.exports.getUser = async (ctx, next) => {
    let username = ctx.params.username

    // Fetch user
    let userRes = await usersModel.fetchUserInfoByUsername(username)

    // Check if user exists
    if(userRes.length < 1) {
        ctx.state.noRender = true
        await next()
        return
    }

    let user = userRes[0]

    // Fetch total media by user
    let totalMedia = await mediaModel.fetchBooruVisibleMediaCountByUploaderUsername(username)

    // Get pagination info
    let pagination = paginationUtil.paginatedRouteInfo(ctx, totalMedia, true)

    // Fetch media by user
    let media = await mediaModel.fetchBooruVisibleMediaInfosByUploaderUsername(username, pagination.queryOffset, pagination.queryLimit, mediaModel.Order.CREATED_DESC)

    // Enumerate tags from items
    let resultTags = []
    for(file of media)
        for(tag of file.tags)
            if(!resultTags.includes(tag))
                resultTags.push(tag)
    
    // Sort tags alphabetically
    resultTags.sort()

    // Put pagination information
    ctx.state.pagination = pagination
    
    // Set page title
    ctx.state.pageTitle = 'Items by '+user.username

    // Put metadata
    ctx.state.metaDescription = `View ${totalMedia} item${totalMedia == 1 ? '' : 's'} by ${username} on the booru`
    ctx.state.metaImage = '/assets/avatar/'+username

    // Put data
    ctx.state.user = user
    ctx.state.media = media
    ctx.state.resultTags = resultTags
    ctx.state.queryTags = []
}