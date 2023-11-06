import { Context, Next } from 'koa'
import { fetchPostBySlug, fetchPostInfoBySlug, PostInfo, updatePostById } from 'models/posts.model'
import { UserRoles } from 'utils/users.util'
import { arrayToSet, datetimeLocalToDate, setToArray, titleToSlug } from 'utils/misc.util'

// Puts boilerplate context data
function setupCtx(ctx: Context) {
    ctx.state.error = null
    ctx.state.content = ''
    ctx.state.title = ''
    ctx.state.comments = true
    ctx.state.publishDate = null
    ctx.state.publish = false
    ctx.state.tags = ''
    ctx.state.showTitle = true
}

// Fetches the page post if possible, otherwise redirects or goes to the next route and returns null
async function fetchPostIfPossible(ctx: Context, next: Next): Promise<PostInfo | null> {
    // Deal with unauthenticated and unauthorized users
    if(!ctx.state.authed) {
        ctx.state.noRender = true
        ctx.redirect('/login?next='+encodeURIComponent(ctx.path))
        return null
    }

    // Check if user is a contributor
    if(ctx.state.user.role < UserRoles.CONTRIBUTOR) {
        ctx.state.noRender = true
        await next()
        return null
    }

    // Fetch post
    const [ post ] = await fetchPostInfoBySlug(true, ctx.params.slug)

    // Check if it exists
    if(!post) {
        ctx.state.noRender = true
        await next()
        return null
    }

    return post
}

/**
 * GET controller for edit blog page
 * @param ctx The context
 * @param next The next function
 */
export async function getEditblog(ctx: Context, next: Next) {
    setupCtx(ctx)

    const post = await fetchPostIfPossible(ctx, next)
    if(post === null)
        return

    // Set page title
    ctx.state.pageTitle = `Edit "${post.title}"`

    // Set state
    ctx.state.slug = post.slug
    ctx.state.content = post.content
    ctx.state.title = post.title
    ctx.state.comments = post.enable_comments
    ctx.state.published = post.published
    ctx.state.publishDate = post.publish_date ? new Date(post.publish_date) : null
    ctx.state.tags = post.tags
    ctx.state.showTitle = post.show_title
}

/**
 * POST controller for edit blog page
 * @param ctx The context
 * @param next The next function
 */
export async function postEditblog(ctx: Context, next: Next) {
    setupCtx(ctx)

    const post = await fetchPostIfPossible(ctx, next)
    if(post === null)
        return

    // Set page title
    ctx.state.pageTitle = `Edit "${post.title}"`

    // Collect data
    const body = ctx.request.body
    const slug = titleToSlug((body.slug || '').trim())
    const enableComments = body.comments === 'on'
    const published = body.published === 'on'
    const publishDate = body.publishdate ? datetimeLocalToDate(body.publishdate, parseInt(body.publishtz, 10)) : null
    const showTitle = body.showtitle === 'on'
    const title = body.title?.trim()
    const content = body.content?.trim()
    const tags = setToArray(body.tags || '')

    // Set state
    ctx.state.slug = slug
    ctx.state.comments = enableComments
    ctx.state.published = published
    ctx.state.publishDate = publishDate
    ctx.state.showTitle = showTitle
    ctx.state.title = title || ''
    ctx.state.content = content || ''
    ctx.state.tags = arrayToSet(tags)

    // Check for data
    if(slug && title && content) {
        // If slug is changed, check if it's available
        if(slug !== post.slug) {
            const slugRes = await fetchPostBySlug(slug)

            if(slugRes.length > 0) {
                ctx.state.error = `The slug "${slug}" is already taken by another post`
                return
            }
        }

        // Update post
        await updatePostById(post.id, title, slug, content, tags, enableComments, published, publishDate, showTitle)

        // Redirect to possibly new slug
        ctx.state.noRender = true
        ctx.redirect('/blog/'+slug+'/edit')
    } else {
        ctx.state.error = 'Empty title or post'
    }
}