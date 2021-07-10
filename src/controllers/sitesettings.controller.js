const config = require('../../config.json')
const usersUtil = require('../utils/users.util')
const { saveConfig } = require('../utils/config.util')

/**
 * @param {import('koa').Context} ctx 
 * @param {Function} next 
 * @returns {boolean}
 */
async function handleUnauthorized(ctx, next) {
    // Deal with unauthenticated and unauthorized users
    if(!ctx.state.authed) {
        ctx.state.noRender = true
        ctx.redirect('/login?next='+encodeURIComponent(ctx.path))
        return false
    }

    // Check if user is an admin
    if(ctx.state.user.role < usersUtil.Roles.ADMIN) {
        ctx.state.noRender = true
        await next()
        return false
    }

    return true
}

/**
 * @param {import('koa').Context} ctx 
 */
function setupCtx(ctx) {
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
 * @param {import("koa").Context} ctx The context
 */
module.exports.getSiteSettings = async (ctx, next) => {
    if(!(await handleUnauthorized(ctx, next)))
        return

    // Setup context
    setupCtx(ctx)
}

/**
 * POST controller for site settings page
 * @param {import('koa').Context} ctx 
 */
module.exports.postSiteSettings = async (ctx, next) => {
    if(!(await handleUnauthorized(ctx, next)))
        return

    // Setup context
    setupCtx(ctx)

    // Collect data
    let body = ctx.request.body
    let siteTitle = body['site-title']
    let siteDescription = body['site-description']
    let showContributors = body['show-contributors']?.toLowerCase() == 'on'
    let maxUploadSize = body['max-upload-size']*1
    let captchaExpireSeconds = body['captcha-expire-seconds']*1
    let notFoundPage = body['not-found-page']
    let errorPage = body['error-page']
    let pageSize = body['page-size']*1
    let booruPageSize = body['booru-page-size']*1
    
    // Check data
    if(siteTitle && siteDescription && showContributors != undefined && !isNaN(maxUploadSize) && !isNaN(captchaExpireSeconds) && notFoundPage && errorPage && !isNaN(pageSize)) {
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