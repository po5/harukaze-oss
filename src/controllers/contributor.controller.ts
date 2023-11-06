import config from '../../config.json'
import { Context, Next } from 'koa'
import { fetchUserInfoByUsername } from 'models/users.model'
import { UserRoles } from 'utils/users.util'
import { fetchBooruVisibleMediaCountByUploaderUsername } from 'models/media.model'
import { fetchPublishedPostInfosByAuthor, PostOrder } from 'models/posts.model'

/**
 * GET controller for contributor page
 * @param ctx The context
 * @param next The next function
 */
export async function getContributor(ctx: Context, next: Next) {
    const username = ctx.params.username

    // Fetch user
    const [ user ] = await fetchUserInfoByUsername(username)

    // Check if user exists and if it's a contributor
    if(!user || user.role < UserRoles.CONTRIBUTOR) {
        ctx.state.noRender = true
        await next()
        return
    }

    let mediaCount = 0

    // Fetch user's booru upload count if the booru is enabled
    if(config.site.enableBooru)
        mediaCount = await fetchBooruVisibleMediaCountByUploaderUsername(user.username)

    // Fetch user's posts
    const posts = await fetchPublishedPostInfosByAuthor(user.id, false, 0, Number.MAX_SAFE_INTEGER, PostOrder.CREATED_DESC)

    // Put context data
    ctx.state.username = user.username
    ctx.state.bio = user.bio
    ctx.state.info = user.info
    ctx.state.createdOn = user.created_on
    ctx.state.avatarUrl = '/assets/avatar/'+user.username
    ctx.state.mediaCount = mediaCount
    ctx.state.posts = posts

    // Page title
    ctx.state.pageTitle = user.username
    // Meta image
    ctx.state.metaImage = '/assets/avatar/'+user.username
    // Meta description
    ctx.state.metaDescription = user.bio || `${user.username} is a contributor on ${config.site.title}!`
}