const postsModel = require('../models/posts.model')
const usersUtil = require('../utils/users.util')
const utils = require('../utils/misc.util')

// Puts boilerplate context data
function setupCtx(ctx) {
    ctx.state.error = null
    ctx.state.content = ''
    ctx.state.title = ''
    ctx.state.comments = true
    ctx.state.publishDate = null
    ctx.state.publish = false
    ctx.state.tags = ''
    ctx.state.showTitle = true
}

/**
 * GET controller for edit blog page
 * @param {import("koa").Context} ctx The context
 * @param {Function} next
 */
module.exports.getEditblog = async (ctx, next) => {
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

    // Fetch post
    let postRes = await postsModel.fetchPostBySlug(ctx.params.slug)

    // Check if it exists
    if(postRes.length < 1) {
        ctx.state.noRender = true
        await next()
        return
    }

    let post = postRes[0]

    // Set page title
    ctx.state.pageTitle = `Edit "${post.post_title}"`

    // Set state
    ctx.state.slug = post.post_slug
    ctx.state.content = post.post_content
    ctx.state.title = post.post_title
    ctx.state.comments = post.post_enable_comments
    ctx.state.published = post.post_published
    ctx.state.publishDate = post.post_publish_date ? new Date(post.post_publish_date) : null
    ctx.state.tags = post.post_tags
    ctx.state.showTitle = post.post_show_title
}

/**
 * POST controller for edit blog page
 * @param {import('koa').Context} ctx The context
 */
module.exports.postEditblog = async ctx => {
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

    // Fetch post
    let postRes = await postsModel.fetchPostBySlug(ctx.params.slug)

    // Check if it exists
    if(postRes.length < 1) {
        ctx.state.noRender = true
        await next()
        return
    }

    let post = postRes[0]

    // Set page title
    ctx.state.pageTitle = `Edit "${post.post_title}"`

    // Collect data
    let body = ctx.request.body
    let slug = utils.titleToSlug((body.slug || '').trim())
    let enableComments = body.comments === 'on'
    let published = body.published === 'on'
    let publishDate = body.publishdate ? new Date(body.publishdate) : null
    let showTitle = body.showtitle === 'on'
    let title = body.title
    if(title)
        title = title.trim()
    let content = body.content
    if(content)
        content = content.trim()
    let tags = utils.setToArray(body.tags || '')

    // Set state
    ctx.state.slug = slug
    ctx.state.comments = enableComments
    ctx.state.published = published
    ctx.state.publishDate = publishDate
    ctx.state.showTitle = showTitle
    ctx.state.title = title || ''
    ctx.state.content = content || ''
    ctx.state.tags = utils.arrayToSet(tags)

    // Check for data
    if(slug && title && content) {
        // If slug is changed, check if it available
        if(slug !== post.post_slug) {
            let slugRes = await postsModel.fetchPostBySlug(slug)

            if(slugRes.length > 0) {
                ctx.state.error = `The slug "${slug}" is already taken by another post`
                return
            }
        }

        // Update post
        await postsModel.updatePostById(post.id, title, slug, content, tags, enableComments, published, publishDate, showTitle, [])

        // Redirect to possibly new slug
        ctx.state.noRender = true
        ctx.redirect('/blog/'+slug+'/edit')
    } else {
        ctx.state.error = 'Empty title or post'
    }
}