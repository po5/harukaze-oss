import { Context, Next } from 'koa'
import { UserRoles } from 'utils/users.util'
import { fetchPageBySlug, fetchPageInfoBySlug, PageInfo, updatePageById } from 'models/pages.model'
import { titleToSlug } from 'utils/misc.util'
import { refreshLinkShownPages } from 'utils/pages.util'

// Puts boilerplate context data
function setupCtx(ctx: Context) {
    ctx.state.error = null
    ctx.state.content = ''
    ctx.state.title = ''
    ctx.state.showLink = true
}

// Fetches the page if possible, otherwise redirects or goes to the next route and returns null
async function fetchPageIfPossible(ctx: Context, next: Next): Promise<PageInfo | null> {
    // Deal with unauthenticated and unauthorized users
    if(!ctx.state.authed) {
        ctx.state.noRender = true
        ctx.redirect('/login?next='+encodeURIComponent(ctx.path))
        return null
    }

    // Check if user is an admin
    if(ctx.state.user.role < UserRoles.ADMIN) {
        ctx.state.noRender = true
        await next()
        return null
    }

    // Fetch page
    const [ page ] = await fetchPageInfoBySlug(true, ctx.params.slug)

    // Check if it exists
    if(!page) {
        ctx.state.noRender = true
        await next()
        return null
    }

    return page
}

/**
 * GET controller for editing user-created pages
 * @param ctx The context
 * @param next The next function
 */
export async function getEditpage(ctx: Context, next: Next) {
    setupCtx(ctx)

    const page = await fetchPageIfPossible(ctx, next)
    if(page === null)
        return

    // Set page title
    ctx.state.pageTitle = `Edit "${page.title}"`

    // Set state
    ctx.state.slug = page.slug
    ctx.state.content = page.content
    ctx.state.title = page.title
    ctx.state.showLink = page.show_link
}

/**
 * POST controller for edit user-created pages
 * @param ctx The context
 * @param next The next function
 */
export async function postEditpage(ctx: Context, next: Next) {
    setupCtx(ctx)

    const page = await fetchPageIfPossible(ctx, next)
    if(page === null)
        return

    // Set page title
    ctx.state.pageTitle = `Edit "${page.title}"`

    // Collect data
    const body = ctx.request.body
    const slug = titleToSlug((body.slug || '').trim())
    const showLink = body.showlink === 'on'
    const title = body.title?.trim()
    const content = body.content?.trim()

    // Set state
    ctx.state.slug = slug
    ctx.state.showLink = showLink
    ctx.state.title = title || ''
    ctx.state.content = content || ''

    // Check for data
    if(slug && title && content) {
        // If slug is changed, check if it's available
        if(slug !== page.slug) {
            let slugRes = await fetchPageBySlug(slug)

            if(slugRes.length > 0) {
                ctx.state.error = `The slug "${slug}" is already taken by another page`
                return
            }
        }

        // Update page
        await updatePageById(page.id, title, slug, content, showLink)

        // Refresh link-shown pages if showLink changed
        if(showLink !== page.show_link)
            await refreshLinkShownPages()

        // Redirect to possibly new slug
        ctx.state.noRender = true
        ctx.redirect('/page/'+slug+'/edit')
    } else {
        ctx.state.error = 'Empty title or page'
    }
}