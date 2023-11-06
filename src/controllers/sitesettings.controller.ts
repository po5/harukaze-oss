import config from '../../config.json'
import { Context, Next } from 'koa'
import { UserRoles } from 'utils/users.util'
import { saveConfig } from 'utils/config.util'

async function handleUnauthorized(ctx: Context, next: Next): Promise<boolean> {
    // Deal with unauthenticated and unauthorized users
    if(!ctx.state.authed) {
        ctx.state.noRender = true
        ctx.redirect('/login?next='+encodeURIComponent(ctx.path))
        return false
    }

    // Check if user is an admin
    if(ctx.state.user.role < UserRoles.ADMIN) {
        ctx.state.noRender = true
        await next()
        return false
    }

    return true
}

// Puts boilerplate context data
function setupCtx(ctx: Context) {
    // Page title
    ctx.state.pageTitle = 'Site Settings'

    // Error defaults to null
    ctx.state.error = null

    // Config values
    ctx.state.siteTitle = config.site.title
    ctx.state.siteDescription = config.site.description
    ctx.state.showContributors = config.site.showContributors
    ctx.state.maxUploadSize = config.site.maxUploadSize
    ctx.state.captchaExpireSeconds = config.site.captchaExpireSeconds
    ctx.state.notFoundPage = config.site.notFoundPage
    ctx.state.errorPage = config.site.errorPage
    ctx.state.pageSize = config.pagination.pageSize
    ctx.state.booruPageSize = config.pagination.booruPageSize
}

/**
 * GET controller for site settings page
 * @param ctx The context
 * @param next The next function
 */
export async function getSiteSettings(ctx: Context, next: Next) {
    if(!(await handleUnauthorized(ctx, next)))
        return

    // Setup context
    setupCtx(ctx)
}

/**
 * POST controller for site settings page
 * @param ctx The context
 * @param next The next function
 */
export async function postSiteSettings(ctx: Context, next: Next) {
    if(!(await handleUnauthorized(ctx, next)))
        return

    // Setup context
    setupCtx(ctx)

    // Collect data
    const body = ctx.request.body
    const siteTitle = body['site-title']
    const siteDescription = body['site-description']
    const showContributors = body['show-contributors']?.toLowerCase() === 'on'
    const maxUploadSize = parseInt(body['max-upload-size'], 10)
    const captchaExpireSeconds = body['captcha-expire-seconds']*1
    const notFoundPage = body['not-found-page']
    const errorPage = body['error-page']
    const pageSize = parseInt(body['page-size'], 10)
    const booruPageSize = parseInt(body['booru-page-size'], 10)
    
    // Check data
    if(
        siteTitle
        && siteDescription
        && showContributors !== undefined
        && !isNaN(maxUploadSize)
        && !isNaN(captchaExpireSeconds)
        && notFoundPage
        && errorPage
        && !isNaN(pageSize)
    ) {
        // Set site title
        ctx.state.siteTitle = siteTitle
        config.site.title = siteTitle

        // Set site description
        ctx.state.siteDescription = siteDescription
        config.site.description = siteDescription

        // Set show contributors
        ctx.state.showContributors = showContributors
        config.site.showContributors = showContributors

        // Set max upload size
        ctx.state.maxUploadSize = maxUploadSize
        config.site.maxUploadSize = maxUploadSize

        // Set captcha expire seconds
        ctx.state.captchaExpireSeconds = captchaExpireSeconds
        config.site.captchaExpireSeconds = captchaExpireSeconds

        // Set not found page
        ctx.state.notFoundPage = notFoundPage
        config.site.notFoundPage = notFoundPage
        
        // Set error page
        ctx.state.errorPage = errorPage
        config.site.errorPage = errorPage

        // Set page size
        ctx.state.pageSize = pageSize
        config.pagination.pageSize = pageSize

        // Set booru page size
        ctx.state.booruPageSize = booruPageSize
        config.pagination.booruPageSize = booruPageSize

        // Save changes
        await saveConfig()
    } else {
        ctx.state.error = 'Missing or malformed value(s)'
    }
}