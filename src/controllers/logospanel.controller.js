const usersUtil = require('../utils/users.util')
const logosUtil = require('../utils/logos.util')
const fs = require('fs')
const util = require('util')
const { generateAlphanumericString } = require('../utils/misc.util')
const copyFile = util.promisify(fs.copyFile)
const unlink = util.promisify(fs.unlink)

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
async function setupCtx(ctx) {
    // Page title
    ctx.state.pageTitle = 'Logos Panel'

    // Error defaults to null
    ctx.state.error = null

    // Logos
    ctx.state.logos = await logosUtil.getLogoNames()
}

/**
 * GET controller for logos panel page
 * @param {import("koa").Context} ctx The context
 */
module.exports.getLogosPanel = async (ctx, next) => {
    if(!(await handleUnauthorized(ctx, next)))
        return

    // Setup context
    await setupCtx(ctx)
}

/**
 * POST controller for logos panel page
 * @param {import('koa').Context} ctx 
 */
module.exports.postLogosPanel = async (ctx, next) => {
    if(!(await handleUnauthorized(ctx, next)))
        return

    // Setup context
    await setupCtx(ctx)

    // Collect data
    let body = ctx.request.body
    let action = body.action
    
    // Handle actions
    if(action == 'delete') {
        let name = body.name

        // Check for name
        if(!name) {
            ctx.state.error = 'No name specified'
            return
        }

        // Get logos
        let logos = await logosUtil.getLogoPaths()

        // Check if logo can be deleted
        if(logos.length > 0) {
            // Delete logo
            await logosUtil.deleteLogoByName(name)

            // Reload logos
            ctx.state.logos = await logosUtil.getLogoNames()
        } else {
            ctx.state.error = 'Cannot delete logos when there are only 1'
        }
    } else if(action == 'upload') {
        // Check for file
        let files = ctx.request.files

        if('file' in files) {
            let file = files.file

            if(file.type.startsWith('image/')) {
                let ext = file.name.substring(file.name.lastIndexOf('.')+1)

                // Generate key
                let key = generateAlphanumericString(10)+'.'+ext

                // Copy file
                await copyFile(file.path, 'media/logos/'+key)

                // Delete original file
                await unlink(file.path)

                // Reload logos
                ctx.state.logos = await logosUtil.getLogoNames()
            } else {
                ctx.state.error = 'Can only upload images'
            }
        } else {
            ctx.state.error = 'No file provided'
        }
    }
}