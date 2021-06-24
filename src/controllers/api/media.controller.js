const config = require('../../../config.json')
const fs = require('fs')
const util = require('util')
const unlink = util.promisify(fs.unlink)
const copyFile = util.promisify(fs.copyFile)
const mediaModel = require('../../models/media.model')
const utils = require('../../utils/misc.util')
const mediaUtils = require('../../utils/media.util')
const FileType = require('file-type')

/**
 * GET controller for media
 * @param {import("koa").Context} ctx The context
 */
module.exports.getMedia = async ctx => {
    // Collect data
    let body = ctx.request.query
    let offset = isNaN(body.offset) ? 0 : Math.max(body.offset*1, 0)
    let limit = isNaN(body.limit) ? 50 : Math.min(Math.max(body.limit*1, 0), 50)
    let order = isNaN(body.order) ? 0 : Math.min(Math.max(body.order*1, 0), Object.keys(mediaModel.Order).length)

    // Fetch total media
    let total = await mediaModel.fetchMediaCount()

    // Fetch media
    let media = await mediaModel.fetchMediaInfos(offset, limit, order)

    // Send success
    ctx.apiSuccess({ media, total })
}

/**
 * POST controller for media upload
 * @param {import('koa').Context} ctx The context
 */
module.exports.postUpload = async ctx => {
    let files = ctx.request.files

    if('file' in files) {
        let file = files.file

        // Check file size
        if(file.size > config.site.maxUploadSize) {
            // Delete file
            await unlink(file.path)

            // Error
            ctx.apiError('too_large', {
                max_size: config.site.maxUploadSize
            })
        } else {
            // Check if media exists with the same hash
            let hashRes = await mediaModel.fetchMediaByHash(file.hash)

            if(hashRes.length > 0) {
                let media = hashRes[0]

                // Delete uploaded file
                await unlink(file.path)

                // Send success with existing media ID
                ctx.apiSuccess({
                    id: media.id
                })
            } else { // Proceed with upload
                // Generate key (filename) for file on disk
                let fnameParts = utils.splitFilename(file.name)
                let keyId = utils.generateAlphanumericString(10)
                let key = fnameParts.length > 1 ? keyId+'.'+fnameParts[1] : keyId

                // Determine file MIME
                let mime = file.type
                if(!mime || mime == 'application/octet-stream')
                    // Probe file in filesystem to try to determine the true type, since sometimes clients return "application/octet-stream" if they don't know the type of the file that's being uploaded
                    mime = await (await FileType.fromFile(file.path)).mime

                // Generate thumbnail if image or video
                let thumbKey = null
                if(mime.startsWith('image/') || mime.startsWith('video/')) {
                    try {
                        let key = keyId+'.jpg'
                        await mediaUtils.generateThumbnail(file.path, 'media/thumbnails/'+key)
                        
                        // Thumbnailing succeeded, set thumbKey
                        thumbKey = key
                    } catch(err) {
                        console.warn(`Failed to generate thumbnail for file ${file.name} (${mime}, ${file.path} on disk):`)
                        console.warn(err)
                    }
                }

                // Generate metadata
                let title = utils.filenameToTitle(file.name)

                // Copy file to media directory and delete original
                await copyFile(file.path, 'media/'+key)
                await unlink(file.path)

                // Create media entry
                await mediaModel.createMedia(ctx.state.user.id, title, file.name, mime, key, [], false, thumbKey, file.size, file.hash)

                // Fetch newly created media and return its ID
                let mediaRes = await mediaModel.fetchMediaByHash(file.hash)

                // This should never fail, but we're going to check anyway, just in case
                if(mediaRes.length > 0) {
                    let media = mediaRes[0]

                    // Return success and newly created media ID
                    ctx.apiSuccess({
                        id: media.id
                    })
                } else {
                    console.error(`Created new media file with hash ${file.hash}, but could not find newly created database entry for it!`)
                    ctx.apiError('internal_error')
                }
            }
        }
    } else {
        ctx.apiError('no_file_provided')
    }
}