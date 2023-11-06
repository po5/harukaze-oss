import { Context, Next } from 'koa'
import { UserRoles } from 'utils/users.util'
import { titleToSlug } from 'utils/misc.util'
import { createPage, fetchPageCountBySlugRegex } from 'models/pages.model'
import { refreshLinkShownPages } from 'utils/pages.util'

// Puts boilerplate context data
function setupCtx(ctx: Context) {
    ctx.state.pageTitle = 'New Page'
    ctx.state.error = null
    ctx.state.content = ''
    ctx.state.title = ''
    ctx.state.showLink = true
}

/**
 * GET controller for new user-created pages
 * @param ctx The context
 * @param next The next function
 */
export async function getNewpage(ctx: Context, next: Next) {
    setupCtx(ctx)

    // Deal with unauthenticated and unauthorized users
    if(!ctx.state.authed) {
        ctx.state.noRender = true
        ctx.redirect('/login?next='+encodeURIComponent(ctx.path))
        return
    }

    // Check if user is an admin
    if(ctx.state.user.role < UserRoles.ADMIN) {
        ctx.state.noRender = true
        await next()
    }
}

/**
 * POST controller for new user-created pages
 * @param ctx The context
 * @param next The next function
 */
export async function postNewpage(ctx: Context, next: Next) {
    setupCtx(ctx)

    // Deal with unauthenticated and unauthorized users
    if(!ctx.state.authed) {
        ctx.state.noRender = true
        ctx.redirect('/login?next='+encodeURIComponent(ctx.path))
        return
    }

    // Check if user is an admin
    if(ctx.state.user.role < UserRoles.ADMIN) {
        ctx.state.noRender = true
        await next()
        return
    }

    // Collect data
    const body = ctx.request.body
    const showLink = body.showlink === 'on'
    const title = body.title?.trim()
    const content = body.content?.trim()

    // Set state
    ctx.state.showLink = showLink
    ctx.state.title = title || ''
    ctx.state.content = content || ''

    // Check for data
    if(title && content) {
        // Generate slug
        let slug = titleToSlug(title)

        // Fetch duplicate slug count
        const dupCount = await fetchPageCountBySlugRegex(`^${slug}(-[0-9]+)?$`)

        // If there are any duplicates, append number to the end of the slug
        if(dupCount > 0)
            slug += '-'+(dupCount+1)

        // Create page
        await createPage(ctx.state.user.id, title, slug, content, showLink)

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