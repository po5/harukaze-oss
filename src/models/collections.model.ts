import config from '../../knexfile'
import Knex, { Knex as KnexType } from 'knex'

const knex = Knex(config)

/**
 * Info about a collection
 */
export type CollectionInfo = {
    /**
     * The collection ID
     */
    id: number,

    /**
     * The collection title
     */
    title: string,

    /**
     * A comment left on the collection, or null if none
     */
    comment: string | null,

    /**
     * The collection creator's ID
     */
    creator: number,
    /**
     * The collection creator's username
     */
    creator_username: string | null,

    /**
     * The total number of items in the collection
     */
    items: number,

    /**
     * The media ID of the collection's first item
     */
    first_item: number,

    /**
     * The date the colletion was created on
     */
    created_on: Date
}

/**
 * Orders collection results can be returned in
 */
export enum CollectionOrder {
    /**
     * Creation time, ascending
     */
    CREATED_ASC,
    /**
     * Creation time, descending
     */
    CREATED_DESC
}

/* Utility functions */
function collectionInfo(): KnexType.QueryInterface {
    return knex('collections')
        .select('collections.id')
        .select(knex.ref('collection_title').as('title'))
        .select(knex.ref('collection_comment').as('comment'))
        .select(knex.ref('collection_creator').as('creator'))
        .select(knex.ref('user_username').as('creator_username'))
        .select(knex.ref('collection_created_on').as('created_on'))
        .select(knex.raw(`(
            SELECT COUNT(*)
            FROM collectionitems
            WHERE item_collection = collections.id
        ) AS items`))
        .select(knex.raw(`(
            SELECT item_media
            FROM collectionitems
            WHERE item_collection = collections.id
            ORDER BY item_created_on ASC
            LIMIT 1
        ) AS first_item`))
        .leftJoin('users', 'collection_creator', 'users.id')
}
/**
 * @param rows
 */
function processCollectionInfoRows(rows: any[]): CollectionInfo[] {
    for(const row of rows)
        row.created_on = new Date(row.created_on)
    return rows
}
/**
 * @param order
 */
function orderBy(order: CollectionOrder): string {
    switch(order) {
    case CollectionOrder.CREATED_DESC:
        return 'collections.collection_created_on DESC'
    default:
        return 'collections.collection_created_on ASC'
    }
}

/**
 * Creates a new collection
 * @param title The collection title
 * @param comment The collection comment (can be null)
 * @param creator The ID of the collection creator
 */
export async function createCollection(title: string, comment: string | null, creator: number) {
    return knex('collections')
        .insert({
            collection_title: title,
            collection_comment: comment,
            collection_creator: creator
        })
}

/**
 * Creates a new collection item entry
 * @param media The media ID
 * @param collection The collection ID
 * @param creator The ID of the user who added the item (not the user who created the media or collection)
 */
export async function createCollectionItem(media: number, collection: number, creator: number) {
    return knex('collectionitems')
        .insert({
            item_media: media,
            item_collection: collection,
            item_creator: creator
        })
}

/**
 * Fetches a collection's info by its ID
 * @param id The ID
 * @returns An array with the row containing the collection's info or an empty array if none exists
 */
export async function fetchCollectionInfoById(id: number): Promise<[ CollectionInfo? ]> {
    return processCollectionInfoRows(
        await collectionInfo()
            .where('collections.id', id)
    ) as [ CollectionInfo? ]
}

/**
 * Fetches all collections' info
 * @param offset The offset to return results
 * @param limit The amount of results to return
 * @param order The order of results to return
 * @returns All collections' info
 */
export async function fetchCollectionInfos(offset: number, limit: number, order: CollectionOrder): Promise<CollectionInfo[]> {
    return processCollectionInfoRows(
        await collectionInfo()
            .offset(offset)
            .limit(limit)
            .orderByRaw(orderBy(order))
    )
}

/**
 * Fetches all collections' info by the specified creator
 * @param creator The ID of the creator
 * @param offset The offset to return results
 * @param limit The amount of results to return
 * @param order The order of results to return
 * @returns All collections' info by the specified creator
 */
export async function fetchCollectionInfosByCreator(creator: number, offset: number, limit: number, order: CollectionOrder): Promise<CollectionInfo[]> {
    return processCollectionInfoRows(
        await collectionInfo()
            .where('collection_creator', creator)
            .offset(offset)
            .limit(limit)
            .orderByRaw(orderBy(order))
    )
}

/**
 * Fetches all collections' info that contain the specified media ID
 * @param media The media ID
 * @param offset The offset to return results
 * @param limit The amount of results to return
 * @param order The order of results to return
 * @returns All collections' info that contain the specified media ID
 */
export async function fetchCollectionInfosWithMedia(media: number, offset: number, limit: number, order: CollectionOrder): Promise<CollectionInfo[]> {
    return processCollectionInfoRows(
        await collectionInfo()
            .whereRaw(`(
                SELECT COUNT(*) FROM collectionitems
                WHERE item_collection = collections.id AND item_media = ?
            ) > 0`, [media])
            .offset(offset)
            .limit(limit)
            .orderByRaw(orderBy(order))
    )
}

/**
 * Fetches all collections' info that do not contain the specified media ID
 * @param media The media ID
 * @param offset The offset to return results
 * @param limit The amount of results to return
 * @param order The order of results to return
 * @returns All collections' info that do not contain the specified media ID
 */
export async function fetchCollectionInfosWithoutMedia(media: number, offset: number, limit: number, order: CollectionOrder): Promise<CollectionInfo[]> {
    return processCollectionInfoRows(
        await collectionInfo()
            .whereRaw(`(
                SELECT COUNT(*) FROM collectionitems
                WHERE item_collection = collections.id AND item_media = ?
            ) < 1`, [media])
            .offset(offset)
            .limit(limit)
            .orderByRaw(orderBy(order))
    )
}

/**
 * Returns the total amount of collections
 * @returns The total amount of collections
 */
export async function fetchCollectionsCount(): Promise<number> {
    return (
        await knex('collections')
            .count('*', { as: 'count' })
    )[0].count as number
}

/**
 * Returns the total amount of collections by the specified creator
 * @param creator The ID of the creator
 * @returns The total amount of collections by the specified creator
 */
export async function fetchCollectionsCountByCreator(creator: number): Promise<number> {
    return (await knex('collections')
        .count('*', { as: 'count' })
        .where('collection_creator', creator)
    )[0].count as number
}

/**
 * Returns whether the specified media exists in the provided list
 * @param media The media ID
 * @param collection The collection ID
 * @returns Whether the specified media exists in the provided list
 */
export async function fetchMediaExistsInCollection(media: number, collection: number): Promise<boolean> {
    return (await knex('collectionitems')
        .count('*', { as: 'count' })
        .where('item_media', media)
        .andWhere('item_collection', collection))[0].count > 0
}

// TODO Implement collection name changing

/**
 * Deletes a collection by its ID
 * @param id The ID
 */
export async function deleteCollectionById(id: number) {
    return knex('collections')
        .del()
        .where('id', id)
}

/**
 * Deletes an item in the specified collection with the provided media ID
 * @param media The media ID
 * @param collection The collection ID
 */
export async function deleteCollectionItemByMediaAndCollection(media: number, collection: number) {
    return knex('collectionitems')
        .del()
        .where('item_media', media)
        .andWhere('item_collection', collection)
}