const usersModel = require('../models/users.model')
const postsModel = require('../models/posts.model')
const mediaModel = require('../models/media.model')
const { Roles } = require('../utils/users.util')
const { characterMoodToUrl } = require('../utils/reacts.util')

/**
 * GET controller for contributor page
 * @param {import("koa").Context} ctx The context
 */
module.exports.getContributor = async (ctx, next) => {
    let username = ctx.params.username

    // Fetch user
    let userRes = await usersModel.fetchUserInfoByUsername(username)

    // Check if user exists and if it's a contributor
    if(userRes.length < 1 || userRes[0].role < Roles.CONTRIBUTOR) {
        ctx.state.noRender = true
        await next()
        return
    }

    let user = userRes[0]

    // Fetch user's booru upload count
    let mediaCount = await mediaModel.fetchBooruVisibleMediaCountByUploaderUsername(user.username)

    // Fetch user's posts
    let posts = await postsModel.fetchPublishedPostInfosByAuthor(user.id, false, 0, Number.MAX_SAFE_INTEGER, postsModel.Order.CREATED_DESC)

    // Put context data
    ctx.state.username = user.username
    ctx.state.bio = user.bio
    ctx.state.info = user.info
    ctx.state.createdOn = user.created_on
    ctx.state.avatarUrl = '/assets/avatar/'+user.username
    ctx.state.characterUrl = characterMoodToUrl(-1, user.character)
    ctx.state.mediaCount = mediaCount
    ctx.state.posts = posts

    // Page title
    ctx.state.pageTitle = user.username
}