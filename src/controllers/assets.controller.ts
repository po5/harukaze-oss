import { Context, Next } from "koa";
import fs from 'fs'
import { stat } from 'fs/promises'
import { promisify } from 'util'
import { fetchMediaById } from "models/media.model";
import { random, sanitizePath, splitFilename } from "utils/misc.util";
import { UNSCALABLE_MEDIA_MIMES } from "root/constants";
import { fetchUserByUsername } from "models/users.model";
import { scaleImage } from "utils/media.util";
import { getMoodById, getUsableCharacters } from "utils/moods.util";
import { getLogoPathByName, getLogoPaths } from "utils/logos.util";
const exists = promisify(fs.exists)

function notFound(ctx: Context) {
    ctx.status = 404
    ctx.type = 'text/plain'
    ctx.body = 'File not found'
}

/**
 * GET controller for media assets
 * @param ctx The context
 * @param _next The next function
 */
export async function getMedia(ctx: Context, _next: Next) {
    ctx.res.setHeader('Cache-control', 'public, max-age=86400')

    const id = parseInt(ctx.params.id, 10)

    // Make sure ID is numeric
    if(isNaN(id)) {
        notFound(ctx)
        return
    }

    // Fetch media
    const mediaRes = await fetchMediaById(id)

    // Check if it exists
    if(mediaRes.length < 1) {
        notFound(ctx)
        return
    }

    const media = mediaRes[0]

    // Collect file info
    const key = media.media_key
    const keyParts = splitFilename(key)
    let path = 'media/'+key
    let filename = media.media_filename
    let size = media.media_size
    let mime = media.media_mime.toLowerCase()
    let scaled = false

    // Check if a scaled file needs to be sent
    if(mime.startsWith('image/') && !UNSCALABLE_MEDIA_MIMES.includes(mime)) {
        const query = ctx.query
        const defExt = keyParts[1]?.toLowerCase() || 'jpg'
        const okExts = ['jpg', 'png']
        let ext = (query.format as string || defExt).toLowerCase()
        if(ext === 'jpeg')
            ext = 'jpg'

        if(!okExts.includes(ext))
            ext = defExt

        // Make sure at least one dimension was specified
        const width = parseInt(query.width as string, 10)
        const height = parseInt(query.height as string, 10)
        if(!isNaN(width) || !isNaN(height)) {
            // Create dimensions string and check for cached version
            const dimensionStr = (width || 'X')+'x'+(height || 'X')
            const [ baseKey ] = splitFilename(key)
            const cachePath = 'media/scaled/'+baseKey+'_'+dimensionStr+'.'+ext
            if(!await exists(cachePath)) {
                // Create scaled version
                const scaleWidth = width > 0 ? Math.min(width, 1000) : -1
                const scaleHeight = height > 0 ? Math.min(height, 1000) : -1
                await scaleImage('media/'+media.media_key, scaleWidth, scaleHeight, cachePath)
            }

            // Stat scaled file and set appropriate data
            const info = await stat(cachePath)
            path = cachePath
            filename = splitFilename(media.media_filename)[0]+'.'+ext
            size = info.size
            mime = ext === 'jpg' ? 'image/jpeg' : 'image/'+ext
            scaled = true
        }
    }

    // Set headers
    ctx.res.setHeader('Accept-Ranges', 'bytes')
    ctx.res.setHeader('Vary', 'accept-encoding')
    if(!ctx.params.filename)
        ctx.res.setHeader('Content-Disposition', `filename="${filename.replace(/[^\x00-\x7F]/g, '_')}"`)

    ctx.length = size
    ctx.type = mime
    if(!scaled)
        ctx.etag = media.media_hash

    // Work out what range to send
    let start = 0
    let end = size
    let match = null
    if('range' in ctx.header && (
        match = (ctx.header['range'] || "")
            .match(/bytes=([0-9]+)-([0-9]+)?/)
    )) {
        start = parseInt(match[1], 10)
                
        if(match[2])
            end = parseInt(match[2])

        ctx.status = 206
        ctx.length = end-start
        ctx.res.setHeader('Content-Range', `bytes ${start}-${end-1}/${size}`)
    }

    // Send empty response for HEAD requests
    if(ctx.method === 'HEAD') {
        ctx.res.end()
        return
    }

    // Send file
    ctx.body = fs.createReadStream(path, { start, end })
}

/**
 * GET controller for media thumbnails
 * @param ctx The context
 * @param _next The next function
 */
export async function getThumbnail(ctx: Context, _next: Next) {
    ctx.res.setHeader('Cache-control', 'public, max-age=86400')

    const id = parseInt(ctx.params.id, 10)

    // Make sure ID is numeric
    if(isNaN(id)) {
        notFound(ctx)
        return
    }

    // Fetch media
    const mediaRes = await fetchMediaById(id)
        
    // Check if it exists
    if(mediaRes.length < 1) {
        notFound(ctx)
        return
    }

    const media = mediaRes[0]

    // Check if it has a thumbnail
    if(!media.media_thumbnail_key) {
        ctx.redirect('/static/img/media-placeholder.png')
        return
    }

    // Set headers
    ctx.type = 'image/jpeg'
    ctx.res.setHeader('Content-Disposition', 'filename="thumbnail.jpg"')

    // Send empty response for HEAD requests
    if(ctx.method === 'HEAD') {
        ctx.res.end()
        return
    }

    // Send file
    ctx.body = fs.createReadStream('media/thumbnails/'+media.media_thumbnail_key)
}

/**
 * GET controller for user avatars
 * @param ctx The context
 * @param _next The next function
 */
export async function getAvatar(ctx: Context, _next: Next) {
    ctx.res.setHeader('Cache-control', 'public, max-age=86400')

    const username = ctx.params.username

    // Fetch user
    const userRes = await fetchUserByUsername(username)
        
    // Check if it exists
    if(userRes.length < 1) {
        notFound(ctx)
        return
    }

    const user = userRes[0]!

    // Send empty response for HEAD requests
    if(ctx.method === 'HEAD') {
        ctx.res.end()
        return
    }

    // Check if user has an avatar
    if(user.user_avatar_key) {
        // Work out extension
        const parts = splitFilename(user.user_avatar_key)
        const ext = parts[1] || 'png'

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
 * @param ctx The context
 * @param _next The next function
 */
export async function getMood(ctx: Context, _next: Next) {
    ctx.res.setHeader('Cache-control', 'public, max-age=86400')

    const id = parseInt(ctx.params.id, 10)

    // Make sure ID is numeric
    if(isNaN(id)) {
        notFound(ctx)
        return
    }

    // Fetch mood
    let mood = await getMoodById(id)

    // Try to resolve fallback mood if mood does not exist
    if(!mood) {
        const chars = await getUsableCharacters()

        // If there aren't any usable characters, then a mood can't be chosen
        if(chars.length < 1) {
            notFound(ctx)
            return
        }

        // Fetch first character's default mood and use it
        const char = chars[0]
        mood = await getMoodById(char.default)

        // If that mood can't be found, nothing can be done
        if(!mood) {
            notFound(ctx)
            return
        }
    }

    // Send empty response for HEAD requests
    if(ctx.method === 'HEAD') {
        ctx.res.end()
        return
    }

    // Set headers
    ctx.type = 'image/png'
    ctx.res.setHeader('Content-Disposition', `filename="mood.png"`)

    // Send file
    ctx.body = fs.createReadStream('media/moods/'+mood.key)
}

/**
 * GET controller for logo images
 * @param ctx The context
 * @param _next The next function
 */
export async function getLogo(ctx: Context, _next: Next) {
    // Disable caching
    ctx.res.setHeader('Cache-control', 'no-store')
    ctx.res.setHeader('Pragma', 'no-cache')

    const filename = sanitizePath(ctx.params.filename || '')
    let path = await getLogoPathByName(filename)

    // Check if filename is specified and logo exists
    if(filename && !path) {
        notFound(ctx)
        return
    }

    // Send empty response for HEAD requests
    if(ctx.method === 'HEAD') {
        ctx.res.end()
        return
    }

    // Use random logo if no filename is specified
    if(!filename) {
        // Fetch logo paths
        const paths = await getLogoPaths()

        // Select path
        path = paths[random(0, paths.length)]
    }

    // Figure out logo filename from path
    const fname = (path as string).substring((path as string).lastIndexOf('/')+1)

    // Figure out extension
    const ext = fname.substring(fname.lastIndexOf('.')+1)

    // Set headers
    ctx.type = 'image/'+ext
    ctx.res.setHeader('Content-Disposition', `filename="${fname}"`)

    // Send file
    ctx.body = fs.createReadStream(path as string)
}