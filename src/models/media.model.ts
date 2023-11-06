import config from '../../knexfile'
import Knex, { Knex as KnexType } from 'knex'
import { arrayToSet, setToArray } from 'utils/misc.util'
import { CommentType } from 'models/comments.model'
import { MimeString } from 'types/misc.types'

const knex = Knex(config)

/**
 * Info about a media entry
 */
export type MediaInfo = {
    /**
     * The media ID
     */
    id: number,

    /**
     * The media uploader's ID
     */
    uploader: number,

    /**
     * The media uploader's username
     */
    uploader_username: string | null,

    /**
     * The media title
     */
    title: string,

    /**
     * The media filename
     */
    filename: string,

    /**
     * The media MIME type
     */
    mime: MimeString,

    /**
     * The media key
     */
    key: string,

    /**
     * The media's tags
     */
    tags: string[],

    /**
     * Whether the media should be visible on the booru
     */
    booru_visible: boolean,

    /**
     * The media thumbnail key
     */
    thumbnail_key: string | null,

    /**
     * The media file's size, in bytes
     */
    size: number,

    /**
     * The media file's hash
     */
    hash: string,

    /**
     * The media width, or null if not applicable
     */
    width: number | null,

    /**
     * The media height, or null if not application
     */
    height: number | null,

    /**
     * A comment left on the media, or null if none
     */
    comment: string | null,

    /**
     * The date that the media entry was created on
     */
    created_on: Date
}

/**
 * Orders media results can be returned in
 */
export enum MediaOrder {
    /**
     * Creation time, ascending
     */
    CREATED_ASC,
    /**
     * Creation time, descending
     */
    CREATED_DESC,

    /**
     * Title alphabetically, ascending
     */
    TITLE_ASC,
    /**
     * Title alphabetically, descending
     */
    TITLE_DESC,

    /**
     * Filename alphabetically, ascending
     */
    FILENAME_ASC,
    /**
     * Filename alphabetically, descending
     */
    FILENAME_DESC,

    /**
     * File size, ascending
     */
    SIZE_ASC,
    /**
     * File size, descending
     */
    SIZE_DESC
}

/* Utility functions */
function mediaInfo(): KnexType.QueryInterface {
    return knex('media')
        .select('media.id')
        .select(knex.ref('media_uploader').as('uploader'))
        .select(knex.ref('user_username').as('uploader_username'))
        .select(knex.ref('media_title').as('title'))
        .select(knex.ref('media_filename').as('filename'))
        .select(knex.ref('media_mime').as('mime'))
        .select(knex.ref('media_key').as('key'))
        .select(knex.ref('media_tags').as('tags'))
        .select(knex.ref('media_booru_visible').as('booru_visible'))
        .select(knex.ref('media_thumbnail_key').as('thumbnail_key'))
        .select(knex.ref('media_size').as('size'))
        .select(knex.ref('media_hash').as('hash'))
        .select(knex.ref('media_width').as('width'))
        .select(knex.ref('media_height').as('height'))
        .select(knex.ref('media_comment').as('comment'))
        .select(knex.ref('media_created_on').as('created_on'))
        .select(knex.raw(`(
            SELECT COUNT(*)
            FROM comments
            WHERE comment_post = media.id
            AND comment_type = ?
        ) AS comments`, [ CommentType.BOORU ]))
        .leftJoin('users', 'media_uploader', 'users.id')
}

/**
 * @param rows
 */
function processMediaInfoRows(rows: any[]): MediaInfo[] {
    for(const row of rows) {
        row.tags = setToArray(row.tags)
        row.booru_visible = !!row.booru_visible
        row.created_on = new Date(row.created_on)
    }
    return rows
}
/**
 * @param order
 */
function orderBy(order: MediaOrder): string {
    switch(order) {
    case MediaOrder.CREATED_DESC:
        return 'media.media_created_on DESC'
    case MediaOrder.TITLE_ASC:
        return 'media.media_title ASC'
    case MediaOrder.TITLE_DESC:
        return 'media.media_title DESC'
    case MediaOrder.FILENAME_ASC:
        return 'media.media_filename ASC'
    case MediaOrder.FILENAME_DESC:
        return 'media.media_filename DESC'
    case MediaOrder.SIZE_ASC:
        return 'media.media_size ASC'
    case MediaOrder.SIZE_DESC:
        return 'media.media_size DESC'
    default:
        return 'media.media_created_on ASC'
    }
}

/**
 * Creates a new media entry
 * @param uploader The uploader's ID
 * @param title The media's title
 * @param filename The media's display filename
 * @param mime The media's MIME type
 * @param key The key of the underlying file on disk
 * @param tags The media tags
 * @param booruVisible Whether the media is visible on the booru
 * @param thumbnailKey The key of the underlying thumbnail file on disk (null if no thumbnail)
 * @param size The file's size, in bytes
 * @param hash The file's hash
 * @param comment The file's comment (can be null)
 * @param width The file's width (or null if unknown or not applicable)
 * @param height The file's height (or null if unknown or not applicable)
 */
export async function createMedia(
    uploader: number,
    title: string,
    filename: string,
    mime: MimeString,
    key: string,
    tags: string[],
    booruVisible: boolean,
    thumbnailKey: string | null,
    size: number,
    hash: string,
    comment: string | null,
    width: number | null,
    height: number | null
) {
    return knex('media')
        .insert({
            media_uploader: uploader,
            media_title: title,
            media_filename: filename,
            media_mime: mime,
            media_key: key,
            media_tags: arrayToSet(tags),
            media_booru_visible: booruVisible,
            media_thumbnail_key: thumbnailKey,
            media_size: size,
            media_hash: hash,
            media_comment: comment,
            media_width: width || null,
            media_height: height || null
        })
}

/**
 * Fetches all media (raw)
 * @param offset The offset to return results
 * @param limit The amount of results to return
 * @param order The order of results to return
 * @returns All media
 */
export async function fetchMedia(offset: number, limit: number, order: MediaOrder): Promise<any[]> {
    return knex('media')
        .select('*')
        .offset(offset)
        .limit(limit)
        .orderByRaw(orderBy(order))
}

/**
 * Fetches info about all media
 * @param offset The offset to return results
 * @param limit The amount of results to return
 * @param order The order of results to return
 * @returns All media's info
 */
export async function fetchMediaInfos(offset: number, limit: number, order: MediaOrder): Promise<MediaInfo[]> {
    return processMediaInfoRows(
        await mediaInfo()
            .offset(offset)
            .limit(limit)
            .orderByRaw(orderBy(order))
    )
}

/**
 * Fetches media by its ID (raw)
 * @param id The ID
 * @returns An array with the row containing the media or an empty array if none exists
 */
export async function fetchMediaById(id: number): Promise<[ any? ]> {
    return await knex('media')
        .select('*')
        .where('media.id', id) as [ any? ]
}

/**
 * Fetches a media's info by its ID
 * @param id The ID
 * @returns An array with the row containing the media info or an empty array if none exists
 */
export async function fetchMediaInfoById(id: number): Promise<[ MediaInfo? ]> {
    return processMediaInfoRows(
        await mediaInfo()
            .where('media.id', id)
    ) as [ MediaInfo? ]
}

/**
 * Fetches a booru-visible media's info by its ID
 * @param id The ID
 * @returns An array with the row containing the media info or an empty array if none exists
 */
export async function fetchBooruVisibleMediaInfoById(id: number): Promise<[ MediaInfo? ]> {
    return processMediaInfoRows(
        await mediaInfo()
            .where('media_booru_visible', true)
            .andWhere('media.id', id)
    ) as [ MediaInfo? ]
}

/**
 * Fetches media infos by their IDs
 * @param ids The IDs
 * @returns All media infos with the specified IDs
 */
export async function fetchMediaInfosByIds(ids: number[]): Promise<MediaInfo[]> {
    return processMediaInfoRows(
        await mediaInfo()
            .whereIn('media.id', ids)
    )
}

/**
 * Fetches booru-visible media infos by their IDs
 * @param ids The IDs
 * @returns All booru-visible media infos with the specified IDs
 */
export async function fetchBooruVisibleMediaInfosByIds(ids: number[]): Promise<MediaInfo[]> {
    return processMediaInfoRows(
        await mediaInfo()
            .whereIn('media.id', ids)
            .andWhere('media_booru_visible', true)
    )
}

/**
 * Fetches booru-visible media infos with the specified tags
 * @param tags The tags to search for
 * @param offset The offset to return results
 * @param limit The amount of results to return
 * @param order The order of results to return
 * @returns All booru-visible media infos with the specified tags
 */
export async function fetchBooruVisibleMediaInfosByTags(tags: string[], offset: number, limit: number, order: MediaOrder): Promise<MediaInfo[]> {
    let query = mediaInfo()
            .where('media_booru_visible', true)
            .offset(offset)
            .limit(limit)
            .orderByRaw(orderBy(order))
    
    // Add tags to query
    for(let tag of tags)
        query.andWhereRaw('FIND_IN_SET(?, media_tags) > 0', [ tag ])

    return processMediaInfoRows(await query)
}

/**
 * Fetches booru-visible media infos in the specified collection
 * @param collection The collection ID
 * @param offset The offset to return results
 * @param limit The amount of results to return
 * @param order The order of results to return
 * @returns All booru-visible media infos with the specified tags
 */
export async function fetchBooruVisibleMediaInfosByCollection(collection: number, offset: number, limit: number, order: MediaOrder): Promise<MediaInfo[]> {
    return processMediaInfoRows(
        await mediaInfo()
            .leftJoin('collectionitems', 'item_media', 'media.id')
            .where('media_booru_visible', true)
            .andWhere('item_collection', collection)
            .offset(offset)
            .limit(limit)
            .orderByRaw(orderBy(order))
    )
}

/**
 * Returns all booru-visible media's info uploaded by the specified uploader
 * @param username The uploader's username
 * @param offset The offset to return results
 * @param limit The amount of results to return
 * @param order The order of results to return
 * @returns All booru-visible media's info uploaded by the specified uploader
 */
export async function fetchBooruVisibleMediaInfosByUploaderUsername(username: string, offset: number, limit: number, order: MediaOrder): Promise<MediaInfo[]> {
    return processMediaInfoRows(
        await mediaInfo()
            .where('media_booru_visible', true)
            .andWhere(knex.raw('LOWER(user_username)') as any, username.toLowerCase())
            .offset(offset)
            .limit(limit)
            .orderByRaw(orderBy(order))
    )
}

/**
 * Fetches a media file by its hash (raw)
 * @param hash The hash to search for
 * @returns An array with the row containing the media or an empty array if none exists
 */
export async function fetchMediaByHash(hash: string): Promise<[ any? ]> {
    return await knex('media')
        .select('*')
        .where('media_hash', hash) as [ any? ]
}

/**
 * Returns rows containing only media tags in a column called "tags"
 * @returns Rows containing only media tags in a column called "tags"
 */
export async function fetchMediaTags(): Promise<{ tags: string }[]> {
    return knex('media')
        .select(knex.ref('media_tags').as('tags'))
}

/**
 * Returns the total amount of media
 * @returns The total amount of media
 */
export async function fetchMediaCount(): Promise<number> {
    return (
        await knex('media')
            .count('*', { as: 'count' })
    )[0].count as number
}

/**
 * Returns the total amount of booru-visible media
 * @returns The total amount of booru-visible media
 */
export async function fetchBooruVisibleMediaCount(): Promise<number> {
    return (await knex('media')
        .count('*', { as: 'count' })
        .where('media_booru_visible', true)
    )[0].count as number
}

/**
 * Returns the total amount of booru-visible media with the specified tags
 * @param tags The tags to search for
 * @returns The total amount of booru-visible media with the specified tags
 */
export async function fetchBooruVisibleMediaCountByTags(tags: string[]): Promise<number> {
    // Start query
    let query = knex('media')
        .count('*', { as: 'count' })
        .where('media_booru_visible', true)
    
    // Add tags to query
    for(let tag of tags)
        query.andWhereRaw('FIND_IN_SET(?, media_tags) > 0', [tag])
    
    return (await query)[0].count as number
}

/**
 * Returns the amount of booru-visible media uploaded by the specified uploader
 * @param username The uploader's username
 * @returns The amount of booru-visible media uploaded by the specified uploader
 */
export async function fetchBooruVisibleMediaCountByUploaderUsername(username: string): Promise<number> {
    return (await knex('media')
        .count('*', { as: 'count' })
        .where('media_booru_visible', true)
        .andWhere(knex.raw('LOWER(user_username)') as any, username.toLowerCase())
        .leftJoin('users', 'media_uploader', 'users.id'))[0].count as number
}

/**
 * Returns the amount of booru-visible media in the specified collection
 * @param collection The collection ID
 * @returns The amount of booru-visible media in the specified collection
 */
export async function fetchBooruVisibleMediaCountByCollection(collection: number): Promise<number> {
    return (await knex('media')
        .count('*', { as: 'count' })
        .where('media_booru_visible', true)
        .andWhere('item_collection', collection)
        .leftJoin('collectionitems', 'item_media', 'media.id'))[0].count as number
}

/**
 * Fetches the ID of a media entry either after or before the specified ID, and with the provided parameters
 * @param isAfter Whether to fetch after the provided ID, otherwise fetches before
 * @param relativeTo The ID to use as a reference point
 * @param tags The tags the media entry should have (or null to not require any)
 * @param collection The ID of the collection the media entry should be in (or null to not require any)
 * @param uploaderUsername The username of the media entry's uploader (or null to not require any)
 * @returns The ID of a media entry matching the provided criteria, or null if none exists
 */
export async function fetchBooruVisibleMediaIdAfterOrBeforeId(
    isAfter: boolean,
    relativeTo: number,
    tags: string[] | null,
    collection: number | null,
    uploaderUsername: string | null
): Promise<number | null> {
    const query = knex('media')
        .select('media.id')
        .orderBy('media.id', isAfter ? 'asc' : 'desc')
        .limit(1)
        .where('media_booru_visible', true)
        .andWhere('media.id', isAfter ? '>' : '<', relativeTo)

    if(tags && tags.length > 0)
        for(let tag of tags)
            query.andWhereRaw('FIND_IN_SET(?, media_tags) > 0', [tag])

    if(collection !== null)
        query
            .andWhere('item_collection', collection)
            .leftJoin('collectionitems', 'item_media', 'media.id')

    if(uploaderUsername)
        query
            .andWhere(knex.raw('LOWER(user_username)') as any, uploaderUsername.toLowerCase())
            .leftJoin('users', 'media_uploader', 'users.id')

    const res = await query

    if(res.length > 0)
        return res[0].id
    else
        return null
}

/**
 * Returns all media's info with the specified MIME regex
 * @param mimeRegex The MIME regex to match
 * @param offset The offset to return results
 * @param limit The amount of results to return
 * @param order The order of results to return
 * @returns All media's info with the specified MIME regex
 */
export async function fetchMediaInfoByMimeRegex(mimeRegex: string, offset: number, limit: number, order: MediaOrder): Promise<MediaInfo[]> {
    return processMediaInfoRows(
        await mediaInfo()
            .whereRaw('media_mime REGEXP ?', [mimeRegex])
            .offset(offset)
            .limit(limit)
            .orderByRaw(orderBy(order))
    )
}

/**
 * Updates the media entry with the specified ID
 * @param id The ID of the media to update
 * @param title The new title
 * @param tags The new tags
 * @param booruVisible Whether it will be visible on the booru
 * @param comment The new comment (can be null)
 */
export async function updateMediaById(id: number, title: string, tags: string[], booruVisible: boolean, comment: string | null) {
    return knex('media')
        .update({
            media_title: title,
            media_tags: arrayToSet(tags),
            media_booru_visible: booruVisible,
            media_comment: comment
        })
        .where('id', id)
}

/**
 * Updates the dimensions of the media with the specified ID
 * @param id The ID of the media to update
 * @param width The width of the media
 * @param height The height of the media
 */
export async function updateMediaDimensionsById(id: number, width: number | null, height: number | null) {
    return knex('media')
        .update({
            media_width: width,
            media_height: height
        })
        .where('id', id)
}

/**
 * Deletes the media entry with the specified ID, if it exists
 * @param id The ID
 */
export async function deleteMediaById(id: number) {
    return knex('media')
        .del()
        .where('media.id', id)
}