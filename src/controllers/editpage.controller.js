const pagesModel = require('../models/pages.model')
const usersUtil = require('../utils/users.util')
const utils = require('../utils/misc.util')
const { refreshLinkShownPages } = require('../utils/pages.util')

// Puts boilerplate context data
function setupCtx(ctx) {
    ctx.state.error = null
    ctx.state.content = ''
    ctx.state.title = ''
    ctx.state.showLink = true
}

/**
 * GET controller for editing user-created pages
 * @param {import("koa").Context} ctx The context
 * @param {Function} next
 */
module.exports.getEditpage = async (ctx, next) => {
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

    // Fetch page
    let pageRes = await pagesModel.fetchPageBySlug(ctx.params.slug)

    // Check if it exists
    if(pageRes.length < 1) {
        ctx.state.noRender = true
        await next()
        return
    }

    let page = pageRes[0]

    // Set page title
    ctx.state.pageTitle = `Edit "${page.page_title}"`

    // Set state
    ctx.state.slug = page.page_slug
    ctx.state.content = page.page_content
    ctx.state.title = page.page_title
    ctx.state.showLink = page.page_show_link
}

/**
 * POST controller for edit user-created pages
 * @param {import('koa').Context} ctx The context
 * @param {Function} next
 */
module.exports.postEditpage = async (ctx, next) => {
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

    // Fetch page
    let pageRes = await pagesModel.fetchPageBySlug(ctx.params.slug)

    // Check if it exists
    if(pageRes.length < 1) {
        ctx.state.noRender = true
        await next()
        return
    }

    let page = pageRes[0]

    // Set page title
    ctx.state.pageTitle = `Edit "${page.page_title}"`

    // Collect data
    let body = ctx.request.body
    let slug = utils.titleToSlug((body.slug || '').trim())
    let showLink = body.showlink === 'on'
    let title = body.title
    if(title)
        title = title.trim()
    let content = body.content
    if(content)
        content = content.trim()

    // Set state
    ctx.state.slug = slug
    ctx.state.showLink = showLink
    ctx.state.title = title || ''
    ctx.state.content = content || ''

    // Check for data
    if(slug && title && content) {
        // If slug is changed, check if it available
        if(slug !== page.page_slug) {
            let slugRes = await pagesModel.fetchPageBySlug(slug)

            if(slugRes.length > 0) {
                ctx.state.error = `The slug "${slug}" is already taken by another page`
                return
            }
        }

        // Update page
        await pagesModel.updatePageById(page.id, title, slug, content, showLink)

        // Refresh link-shown pages if showLink changed
        if(showLink !== !!page.page_show_link)
            await refreshLinkShownPages()

        // Redirect to possibly new slug
        ctx.state.noRender = true
        ctx.redirect('/page/'+slug+'/edit')
    } else {
        ctx.state.error = 'Empty title or page'
    }
}