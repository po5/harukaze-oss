const mediaModel = require('../models/media.model')
const usersModel = require('../models/users.model')
const moodsModel = require('../models/moods.model')
const utils = require('../utils/misc.util')
const fs = require('fs')

/**
 * @param {import('koa').Context} ctx 
 */
function notFound(ctx) {
    ctx.status = 404
    ctx.type = 'text/plain'
    ctx.body = 'File not found'
}

/**
 * GET controller for media assets
 * @param {import("koa").Context} ctx The context
 */
module.exports.getMedia = async (ctx, next) => {
    let id = ctx.params.id*1

    // Make sure ID is numeric
    if(isNaN(id)) {
        notFound(ctx)
        return
    }

    // Fetch media
    let mediaRes = await mediaModel.fetchMediaById(id)
        
    // Check if it exists
    if(mediaRes.length < 1) {
        notFound(ctx)
        return
    }

    let media = mediaRes[0]

    // Set headers
    ctx.res
        .setHeader('Accept-Ranges', 'bytes')
        .setHeader('Vary', 'accept-encoding')
    if(!ctx.params.filename)
        ctx.res.setHeader('Content-Disposition', `filename="${media.media_filename.replace(/[^\x00-\x7F]/g, '_')}"`)

    ctx.length = media.media_size
    ctx.etag = media.media_hash
    ctx.type = media.media_mime
            
    // Work out what range to send
    let start = 0
    let end = media.media_size
    let match = null
    if('range' in ctx.header && (match = ctx.header['range'].match(/bytes=([0-9]+)\-([0-9]+)?/))) {
        start = match[1]*1
                
        if(match[2])
            end = match[2]*1

        ctx.status = 206
        ctx.length = end-start
        ctx.res.setHeader('Content-Range', `bytes ${start}-${end-1}/${media.media_size}`)
    }

    // Send empty response for HEAD requests
    if(ctx.method == 'HEAD') {
        ctx.res.end()
        return
    }
    

    // Send file
    ctx.body = fs.createReadStream('media/'+media.media_key, { start, end })
}

/**
 * GET controller for media thumbnails
 * @param {import("koa").Context} ctx The context
 */
module.exports.getThumbnail = async (ctx, next) => {
    let id = ctx.params.id*1

    function notFound(ctx) {
        ctx.status = 404
        ctx.type = 'text/plain'
        ctx.body = 'File not found'
    }

    // Make sure ID is numeric
    if(isNaN(id)) {
        notFound(ctx)
        return
    }

    // Fetch media
    let mediaRes = await mediaModel.fetchMediaById(id)
        
    // Check if it exists
    if(mediaRes.length < 1) {
        notFound(ctx)
        return
    }

    let media = mediaRes[0]

    // Check if it has a thumbnail
    if(!media.media_thumbnail_key) {
        ctx.redirect('/static/img/media-placeholder.png')
        return
    }

    // Set headers
    ctx.type = 'image/jpeg'
    ctx.res.setHeader('Content-Disposition', 'filename="thumbnail.jpg"')

    // Send empty response for HEAD requests
    if(ctx.method == 'HEAD') {
        ctx.res.end()
        return
    }

    // Send file
    ctx.body = fs.createReadStream('media/thumbnails/'+media.media_thumbnail_key)
}

/**
 * GET controller for user avatars
 * @param {import("koa").Context} ctx The context
 */
module.exports.getAvatar = async (ctx, next) => {
    let username = ctx.params.username

    function notFound(ctx) {
        ctx.status = 404
        ctx.type = 'text/plain'
        ctx.body = 'File not found'
    }

    // Fetch user
    let userRes = await usersModel.fetchUserByUsername(username)
        
    // Check if it exists
    if(userRes.length < 1) {
        notFound(ctx)
        return
    }

    let user = userRes[0]

    // Send empty response for HEAD requests
    if(ctx.method == 'HEAD') {
        ctx.res.end()
        return
    }

    // Check if user has an avatar
    if(user.user_avatar_key) {
        // Work out extension
        let parts = utils.splitFilename(user.user_avatar_key)
        let ext = parts.length > 1 ? parts[1] : 'png'

        // Set headers
        ctx.type = 'image/'+ext
        ctx.res.setHeader('Content-Disposition', `filename="${user.user_username}.${ext}"`)

        // Send file
        ctx.body = fs.createReadStream('media/avatars/'+user.user_avatar_key)
    } else {
        // Redirect to default
        ctx.type = 'text/plain'
        ctx.body = 'Redirecting to default avatar'
        ctx.redirect('/static/img/defaultavatar.png')
    }
}

/**
 * GET controller for mood images
 * @param {import("koa").Context} ctx The context
 */
module.exports.getMood = async (ctx, next) => {
    let id = ctx.params.id*1

    function notFound(ctx) {
        ctx.status = 404
        ctx.type = 'text/plain'
        ctx.body = 'File not found'
    }

    // Make sure ID is numeric
    if(isNaN(id)) {
        notFound(ctx)
        return
    }

    // Fetch mood
    let moodRes = await moodsModel.fetchMoodInfoById(id)

    // Check if it exists
    if(moodRes.length < 1) {
        notFound(ctx)
        return
    }

    let mood = moodRes[0]

    // Send empty response for HEAD requests
    if(ctx.method == 'HEAD') {
        ctx.res.end()
        return
    }

    // Set headers
    ctx.type = 'image/png'
    ctx.res.setHeader('Content-Disposition', `filename="mood.png"`)

    // Send file
    ctx.body = fs.createReadStream('media/moods/'+mood.key)
}