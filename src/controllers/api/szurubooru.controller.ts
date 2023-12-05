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
import { appSzurubooruClient } from 'utils/szurubooru.util'

/**
 * GET controller for media getting
 * @param ctx The context
 * @param _next The next function
 */
export async function getPost(ctx: Context, _next: Next) {
    // Check for ID
    const id = parseInt(ctx.params.id as string)
    if (isNaN(id)) {
        ctx.apiError('invalid_params')
        return
    }

    // Fetch post
    const post = await appSzurubooruClient!.getPostOrNull(id);

    // Check if it exists
    if(post === null) {
        ctx.apiError('not_found')
        return
    }

    ctx.apiSuccess({ post })
}
