import config from '../../../config.json'
import { Context, Next } from 'koa'
import { unlink, copyFile } from 'fs/promises'
import FileType from 'file-type'
import {
    createMedia, deleteMediaById,
    fetchMediaByHash, fetchMediaById,
    fetchMediaCount,
    fetchMediaInfoById,
    fetchMediaInfos, fetchMediaInfosByIds,
    MediaOrder, updateMediaById
} from 'models/media.model'
import { extractOffsetAndLimit } from 'utils/pagination.util'
import { MAX_API_PAGINATION_LIMIT } from 'root/constants'
import { filenameToTitle, generateAlphanumericString, isTrue, setToArray, splitFilename } from 'utils/misc.util'
import { generateThumbnail, probeFileForDimensions } from 'utils/media.util'
import { MimeString } from 'types/misc.types'
import { CommentType, deleteCommentsByPostIds } from 'models/comments.model'

/**
 * GET controller for media getting
 * @param ctx The context
 * @param _next The next function
 */
export async function getMedia(ctx: Context, _next: Next) {
    const body = ctx.request.query

    // Check for ID
    const id = parseInt(body.id as string)
    if(isNaN(id)) {
        ctx.apiError('missing_params')
        return
    }

    // Fetch media
    const [ media ] = await fetchMediaInfoById(id)

    // Check if it exists
    if(!media) {
        ctx.apiError('not_found')
        return
    }

    ctx.apiSuccess({ media })
}

/**
 * GET controller for media listing
 * @param ctx The context
 * @param _next The next function
 */
export async function getMediaList(ctx: Context, _next: Next) {
    // Collect data
    const body = ctx.request.query
    const { offset, limit } = extractOffsetAndLimit(body, MAX_API_PAGINATION_LIMIT)
    const orderInt = parseInt(body.order as string, 10)
    const order = isNaN(orderInt) ? 0 : Math.min(Math.max(orderInt, 0), Object.keys(MediaOrder).length)

    // Fetch total media
    const total = await fetchMediaCount()

    // Fetch media
    const media = await fetchMediaInfos(offset, limit, order)

    // Send success
    ctx.apiSuccess({ media, total })
}

/**
 * POST controller for media upload
 * @param ctx The context
 * @param _next The next function
 */
export async function postUploadMedia(ctx: Context, _next: Next) {
    const files = ctx.request.files as any

    if(!('file' in files)) {
        ctx.apiError('no_file_provided')
        return
    }

    const file = files.file

    // Check file size
    const filesize = parseInt(file.size, 10)
    if(filesize > config.site.maxUploadSize) {
        // Delete file
        await unlink(file.path)

        // Error
        ctx.apiError('too_large', { max_size: config.site.maxUploadSize })

        return
    }

    // Check if media exists with the same hash
    const [ media ] = await fetchMediaByHash(file.hash)

    if(media) {
        // Delete uploaded file
        await unlink(file.path)

        // Send success with existing media ID
        ctx.apiSuccess({
            id: media.id,
            existing: true
        })
    } else { // Proceed with upload
        // Generate key (filename) for file on disk
        const fnameParts = splitFilename(file.name)
        const keyId = generateAlphanumericString(10)
        const key = fnameParts.length > 1 ? keyId+'.'+fnameParts[1] : keyId

        // Determine file MIME
        let mime: string = file.type
        if(!mime || mime === 'application/octet-stream') {
            // Probe file in filesystem to try to determine the true type, since sometimes clients return "application/octet-stream" if they don't know the type of the file that's being uploaded
            const probeRes = (await FileType.fromFile(file.path))?.mime
            if(probeRes)
                mime = probeRes
        }

        // Generate thumbnail if image or video
        let thumbKey: string | null = null
        if(mime.startsWith('image/') || mime.startsWith('video/') || mime.startsWith('audio/')) {
            try {
                const key = keyId+'.jpg'
                await generateThumbnail(file.path, 'media/thumbnails/'+key)

                // Thumbnailing succeeded, set thumbKey
                thumbKey = key
            } catch(err) {
                console.warn(`Failed to generate thumbnail for file ${file.name} (${mime}, ${file.path} on disk):`)
                console.warn(err)
            }
        }

        // Probe file if an image or video for dimensions
        let mediaWidth: number | null = null
        let mediaHeight: number | null = null
        if(mime.startsWith('image/') || mime.startsWith('video/')) {
            try {
                const dimensions = await probeFileForDimensions(file.path)

                if(dimensions !== null) {
                    mediaWidth = dimensions.width
                    mediaHeight = dimensions.height
                }
            } catch(err) {
                console.warn(`Failed to probe media file ${file.name} (${mime}, ${file.path} on disk):`)
                console.warn(err)
            }
        }

        // Generate metadata
        const title = filenameToTitle(file.name)

        // Copy file to media directory and delete original
        await copyFile(file.path, 'media/'+key)
        await unlink(file.path)

        // Create media entry
        await createMedia(
            ctx.state.user.id,
            title,
            file.name,
            mime as MimeString,
            key,
            [],
            false,
            thumbKey,
            file.size,
            file.hash,
            null,
            mediaWidth,
            mediaHeight
        )

        // Fetch newly created media and return its ID
        const [ media ] = await fetchMediaByHash(file.hash)

        // This should never fail, but we're going to check anyway, just in case
        if(!media) {
            console.error(`Created new media file with hash ${file.hash}, but could not find newly created database entry for it!`)
            ctx.apiError('internal_error')
            return
        }

        // Return success and newly created media ID
        ctx.apiSuccess({
            id: media.id,
            existing: false
        })
    }
}

/**
 * POST controller for media editing
 * @param ctx The context
 * @param _next The next function
 */
export async function postEditMedia(ctx: Context, _next: Next) {
    const body = ctx.request.body

    // Check for correct data
    if(isNaN(body.id) || !body.title || body.tags === undefined || body.booru_visible === undefined || body.comment === undefined) {
        ctx.apiError('missing_params')
        return
    }

    const id = parseInt(body.id, 10)
    const title = body.title.trim()
    const tags = setToArray(body.tags)
    const booruVisible = isTrue(body.booru_visible)
    let comment = body.comment.trim()
    if(comment.length < 1)
        comment = null

    // Validate data
    if(title.length < 1) {
        ctx.apiError('blank_title')
        return
    }

    // Check if the media exists
    const [ media ] = await fetchMediaById(id)

    if(!media) {
        ctx.apiError('not_found')
        return
    }

    // Update the media
    await updateMediaById(id, title, tags, booruVisible, comment)

    // Success
    ctx.apiSuccess()
}

/**
 * POST controller for media deletion
 * @param ctx The context
 * @param _next The next function
 */
export async function postDeleteMedia(ctx: Context, _next: Next) {
    const body = ctx.request.body

    // Check for correct data
    if(isNaN(body.id) && !body.ids) {
        ctx.apiError('missing_params')
        return
    }

    // Parse data
    const idsRaw = body.id ? [ body.id ] : setToArray(body.ids)
    const ids: number[] = []
    for(const id of idsRaw)
        if(!isNaN(id))
            ids.push(id)


    // Fetch media entries
    const media = await fetchMediaInfosByIds(ids)

    // Handle each entry
    for(const file of media) {
        // Delete files
        await unlink('media/'+file.key)
        if(file.thumbnail_key)
            await unlink('media/thumbnails/'+file.thumbnail_key)

        // Delete entry
        await deleteMediaById(file.id)
    }

    // Delete comments on media
    await deleteCommentsByPostIds(ids, CommentType.BOORU)

    // Success
    ctx.apiSuccess()
}