const postsModel = require('../models/posts.model')
const usersUtil = require('../utils/users.util')
const utils = require('../utils/misc.util')

// Puts boilerplate context data
function setupCtx(ctx) {
    ctx.state.pageTitle = 'New Blog'
    ctx.state.error = null
    ctx.state.content = ''
    ctx.state.title = ''
    ctx.state.comments = true
    ctx.state.publish = false
    ctx.state.publishDate = null
    ctx.state.tags = ''
    ctx.state.showTitle = true
}

/**
 * GET controller for new blog page
 * @param {import("koa").Context} ctx The context
 * @param {Function} next
 */
module.exports.getNewblog = async (ctx, next) => {
    setupCtx(ctx)

    // Deal with unauthenticated and unauthorized users
    if(!ctx.state.authed) {
        ctx.state.noRender = true
        ctx.redirect('/login?next='+encodeURIComponent(ctx.path))
        return
    }

    // Check if user is a contributor
    if(ctx.state.user.role < usersUtil.Roles.CONTRIBUTOR) {
        ctx.state.noRender = true
        await next()
    }
}

/**
 * POST controller for new blog page
 * @param {import('koa').Context} ctx The context
 */
module.exports.postNewblog = async ctx => {
    setupCtx(ctx)

    // Deal with unauthenticated and unauthorized users
    if(!ctx.state.authed) {
        ctx.state.noRender = true
        ctx.redirect('/login?next='+encodeURIComponent(ctx.path))
        return
    }

    // Check if user is a contributor
    if(ctx.state.user.role < usersUtil.Roles.CONTRIBUTOR) {
        ctx.state.noRender = true
        await next()
        return
    }

    // Collect data
    let body = ctx.request.body
    let enableComments = body.comments === 'on'
    let publish = body.publish === 'on'
    let publishDate = body.publishdate ? new Date(body.publishdate) : null
    let showTitle = body.showtitle === 'on'
    let title = (body.title || '').trim()
    let content = (body.content || '').trim()
    let tags = utils.setToArray(body.tags || '')

    // Set state
    ctx.state.comments = enableComments
    ctx.state.publish = publish
    ctx.state.publishDate = publishDate
    ctx.state.showTitle = showTitle
    ctx.state.title = title || ''
    ctx.state.content = content || ''
    ctx.state.tags = utils.arrayToSet(tags)

    // Check for data
    if(title && content) {
        // Generate slug
        let slug = utils.titleToSlug(title)

        // Fetch duplicate slug count
        let dupCount = await postsModel.fetchPostCountBySlugRegex(`^${slug}(-[0-9]+)?$`)

        // If there are any duplicates, append number to the end of the slug
        if(dupCount > 0)
            slug += '-'+(dupCount+1)

        // Create post
        await postsModel.createPost(ctx.state.user.id, title, slug, content, tags, enableComments, publish, publishDate, showTitle, [])

        // Redirect to post (even if it wasn't published)
        ctx.state.noRender = true
        ctx.redirect('/blog/'+slug+'/edit')
    } else {
        ctx.state.error = 'Empty title or post'
    }
}