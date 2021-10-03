const pagesModel = require('../models/pages.model')
const usersUtil = require('../utils/users.util')
const utils = require('../utils/misc.util')
const { refreshLinkShownPages } = require('../utils/pages.util')

// Puts boilerplate context data
function setupCtx(ctx) {
    ctx.state.pageTitle = 'New Page'
    ctx.state.error = null
    ctx.state.content = ''
    ctx.state.title = ''
    ctx.state.showLink = true
}

/**
 * GET controller for new user-created pages
 * @param {import("koa").Context} ctx The context
 * @param {Function} next
 */
module.exports.getNewpage = async (ctx, next) => {
    setupCtx(ctx)

    // Deal with unauthenticated and unauthorized users
    if(!ctx.state.authed) {
        ctx.state.noRender = true
        ctx.redirect('/login?next='+encodeURIComponent(ctx.path))
        return
    }

    // Check if user is an admin
    if(ctx.state.user.role < usersUtil.Roles.ADMIN) {
        ctx.state.noRender = true
        await next()
    }
}

/**
 * POST controller for new user-created pages
 * @param {import('koa').Context} ctx The context
 * @param {Function} next
 */
module.exports.postNewpage = async (ctx, next) => {
    setupCtx(ctx)

    // Deal with unauthenticated and unauthorized users
    if(!ctx.state.authed) {
        ctx.state.noRender = true
        ctx.redirect('/login?next='+encodeURIComponent(ctx.path))
        return
    }

    // Check if user is an admin
    if(ctx.state.user.role < usersUtil.Roles.ADMIN) {
        ctx.state.noRender = true
        await next()
        return
    }

    // Collect data
    let body = ctx.request.body
    let showLink = body.showlink === 'on'
    let title = (body.title || '').trim()
    let content = (body.content || '').trim()

    // Set state
    ctx.state.showLink = showLink
    ctx.state.title = title || ''
    ctx.state.content = content || ''

    // Check for data
    if(title && content) {
        // Generate slug
        let slug = utils.titleToSlug(title)

        // Fetch duplicate slug count
        let dupCount = await pagesModel.fetchPageCountBySlugRegex(`^${slug}(-[0-9]+)?$`)

        // If there are any duplicates, append number to the end of the slug
        if(dupCount > 0)
            slug += '-'+(dupCount+1)

        // Create page
        await pagesModel.createPage(ctx.state.user.id, title, slug, content, showLink)

        // Refresh link-shown pages if showLink is true
        if(showLink)
            await refreshLinkShownPages()

        // Redirect to page
        ctx.state.noRender = true
        ctx.redirect('/page/'+slug+'/edit')
    } else {
        ctx.state.error = 'Empty title or page'
    }
}