import { Context, Next } from 'koa'
import { UserRoles } from 'utils/users.util'
import { arrayToSet, datetimeLocalToDate, setToArray, titleToSlug } from 'utils/misc.util'
import { createPost, fetchPostCountBySlugRegex } from 'models/posts.model'

// Puts boilerplate context data
function setupCtx(ctx: Context) {
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
 * @param ctx The context
 * @param next The next function
 */
export async function getNewblog(ctx: Context, next: Next) {
    setupCtx(ctx)

    // Deal with unauthenticated and unauthorized users
    if(!ctx.state.authed) {
        ctx.state.noRender = true
        ctx.redirect('/login?next='+encodeURIComponent(ctx.path))
        return
    }

    // Check if user is a contributor
    if(ctx.state.user.role < UserRoles.CONTRIBUTOR) {
        ctx.state.noRender = true
        await next()
    }
}

/**
 * POST controller for new blog page
 * @param ctx The context
 * @param next The next function
 */
export async function postNewblog(ctx: Context, next: Next) {
    setupCtx(ctx)

    // Deal with unauthenticated and unauthorized users
    if(!ctx.state.authed) {
        ctx.state.noRender = true
        ctx.redirect('/login?next='+encodeURIComponent(ctx.path))
        return
    }

    // Check if user is a contributor
    if(ctx.state.user.role < UserRoles.CONTRIBUTOR) {
        ctx.state.noRender = true
        await next()
        return
    }

    // Collect data
    const body = ctx.request.body
    const enableComments = body.comments === 'on'
    const publish = body.publish === 'on'
    const publishDate = body.publishdate ? datetimeLocalToDate(body.publishdate, parseInt(body.publishtz, 10)) : null
    const showTitle = body.showtitle === 'on'
    const title = body.title?.trim()
    const content = body.content?.trim()
    const tags = setToArray(body.tags || '')

    // Set state
    ctx.state.comments = enableComments
    ctx.state.publish = publish
    ctx.state.publishDate = publishDate
    ctx.state.showTitle = showTitle
    ctx.state.title = title || ''
    ctx.state.content = content || ''
    ctx.state.tags = arrayToSet(tags)

    // Check for data
    if(title && content) {
        // Generate slug
        let slug = titleToSlug(title)

        // Fetch duplicate slug count
        const dupCount = await fetchPostCountBySlugRegex(`^${slug}(-[0-9]+)?$`)

        // If there are any duplicates, append number to the end of the slug
        if(dupCount > 0)
            slug += '-'+(dupCount+1)

        // Create post
        await createPost(ctx.state.user.id, title, slug, content, tags, enableComments, publish, publishDate, showTitle)

        // Redirect to post (even if it wasn't published)
        ctx.state.noRender = true
        ctx.redirect('/blog/'+slug+'/edit')
    } else {
        ctx.state.error = 'Empty title or post'
    }
}