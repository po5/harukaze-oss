import config from '../../knexfile'
import Knex, { Knex as KnexType } from 'knex'

const knex = Knex(config)

/**
 * Info about a page
 */
export type PageInfo = {
    /**
     * The page ID
     */
    id: number,

    /**
     * The page creator's ID
     */
    creator: number,
    /**
     * The page creator's username
     */
    creator_username: string | null,

    /**
     * The page title
     */
    title: string,

    /**
     * The page slug
     */
    slug: string,

    /**
     * Whether to show the page link
     */
    show_link: boolean,

    /**
     * The date the page was created on
     */
    created_on: Date,

    /**
     * The page's content, if included
     */
    content?: string
}

/**
 * Orders page results can be returned in
 */
export enum PageOrder {
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
    TITLE_DESC
}

/* Utility functions */
/**
 * @param withContent
 */
function pageInfo(withContent: boolean): KnexType.QueryInterface {
    let query = knex('pages')
        .select('pages.id')
        .select(knex.ref('page_creator').as('creator'))
        .select(knex.ref('user_username').as('creator_username'))
        .select(knex.ref('page_title').as('title'))
        .select(knex.ref('page_slug').as('slug'))
        .select(knex.ref('page_show_link').as('show_link'))
        .select(knex.ref('page_created_on').as('created_on'))
        .leftJoin('users', 'page_creator', 'users.id')

    if(withContent)
        query.select(knex.ref('page_content').as('content'))
    
    return query
}

/**
 * @param rows
 */
function processPageInfoRows(rows: any[]): PageInfo[] {
    for(const row of rows) {
        row.show_link = !!row.show_link
        row.created_on = new Date(row.created_on)
    }
    return rows
}
/**
 * @param order
 */
function orderBy(order: PageOrder) {
    switch(order) {
    case PageOrder.CREATED_DESC:
        return 'pages.page_created_on DESC'
    case PageOrder.TITLE_ASC:
        return 'pages.page_title ASC'
    case PageOrder.TITLE_DESC:
        return 'pages.page_title DESC'
    default:
        return 'pages.page_created_on ASC'
    }
}

/**
 * Creates a new page
 * @param creator The creator's ID
 * @param title The title
 * @param slug The page slug (used in URLs, like "/page/my-cool-page" if your title is "My Cool Page")
 * @param content The content
 * @param showLink Whether the page's link should be shown in the site's navigation
 */
export async function createPage(creator: number, title: string, slug: string, content: string, showLink: boolean) {
    return knex('pages')
        .insert({
            page_creator: creator,
            page_title: title,
            page_slug: slug,
            page_content: content,
            page_show_link: showLink
        })
}

/**
 * Fetches all pages (raw)
 * @param offset The offset to return results
 * @param limit The amount of results to return
 * @param order The order of results to return
 * @returns All pages
 */
export async function fetchPages(offset: number, limit: number, order: PageOrder): Promise<any[]> {
    return knex('pages')
        .select('*')
        .offset(offset)
        .limit(limit)
        .orderByRaw(orderBy(order))
}

/**
 * Fetches all link-shown pages (raw)
 * @param offset The offset to return results
 * @param limit The amount of results to return
 * @param order The order of results to return
 * @returns All link-shown pages
 */
export async function fetchLinkShownPages(offset: number, limit: number, order: PageOrder): Promise<any[]> {
    return knex('pages')
        .select('*')
        .where('page_show_link', true)
        .offset(offset)
        .limit(limit)
        .orderByRaw(orderBy(order))
}

/**
 * Fetches info about all pages
 * @param withContent Whether to include page content
 * @param offset The offset to return results
 * @param limit The amount of results to return
 * @param order The order of results to return
 * @returns All pages' info
 */
export async function fetchPageInfos(withContent: boolean, offset: number, limit: number, order: PageOrder): Promise<PageInfo[]> {
    return processPageInfoRows(
        await pageInfo(withContent)
            .offset(offset)
            .limit(limit)
            .orderByRaw(orderBy(order))
    )
}

/**
 * Fetches info about all link-shown pages
 * @param withContent Whether to include page content
 * @param offset The offset to return results
 * @param limit The amount of results to return
 * @param order The order of results to return
 * @returns All link-shown pages' info
 */
export async function fetchLinkShownPageInfos(withContent: boolean, offset: number, limit: number, order: PageOrder): Promise<PageInfo[]> {
    return processPageInfoRows(
        await pageInfo(withContent)
            .where('page_show_link', true)
            .offset(offset)
            .limit(limit)
            .orderByRaw(orderBy(order))
    )
}

/**
 * Fetches a page by its slug (raw)
 * @param slug The page slug
 * @returns An array with the row containing the page or an empty array if none exists
 */
export async function fetchPageBySlug(slug: string): Promise<[ any? ]> {
    return await knex('pages')
        .select('*')
        .where('page_slug', slug) as [ any? ]
}

/**
 * Fetches a page's info by its ID
 * @param withContent Whether to include page content
 * @param id The page's ID
 * @returns An array with the row containing the page's info or an empty array if none exists
 */
export async function fetchPageInfoById(withContent: boolean, id: number): Promise<[ PageInfo? ]> {
    return processPageInfoRows(
        await pageInfo(withContent)
            .where('pages.id', id)
    ) as [ PageInfo? ]
}

/**
 * Fetches a page's info by its slug
 * @param withContent Whether to include page content
 * @param slug The page slug
 * @returns An array with the row containing the page's info or an empty array if none exists
 */
export async function fetchPageInfoBySlug(withContent: boolean, slug: string): Promise<[ PageInfo? ]> {
    return processPageInfoRows(
        await pageInfo(withContent)
            .where('page_slug', slug)
    ) as [ PageInfo? ]
}

/**
 * Fetches page infos by their IDs
 * @param withContent Whether to include page content
 * @param ids The IDs
 * @returns All page infos with the specified IDs
 */
export async function fetchPageInfosByIds(withContent: boolean, ids: number[]): Promise<PageInfo[]> {
    return processPageInfoRows(
        await pageInfo(withContent)
            .whereIn('pages.id', ids)
    )
}

/**
 * Returns the total amount of pages
 * @returns The total amount of pages
 */
export async function fetchPageCount(): Promise<number> {
    return (
        await knex('pages')
            .count('*', { as: 'count' })
    )[0].count as number
}

/**
 * Fetches the amount of pages with a slug that matches the provided regular expression
 * @param slugRegex The regular expression
 * @returns The amount of pages with a slug that matches the provided regular expression
 */
export async function fetchPageCountBySlugRegex(slugRegex: string): Promise<number> {
    return (await knex('pages')
        .count('*', { as: 'count' })
        .whereRaw('`page_slug` REGEXP ?', [slugRegex])
    )[0].count as number
}

/**
 * Updates the page with the specified ID
 * @param id The ID of the page to update
 * @param title The page's new title
 * @param slug The page's new slug
 * @param content The page's new content
 * @param showLink Whether the page will now be shown in site navigation
 */
export async function updatePageById(id: number, title: string, slug: string, content: string, showLink: boolean) {
    return knex('pages')
        .update({
            page_title: title,
            page_slug: slug,
            page_content: content,
            page_show_link: showLink
        })
        .where('id', id)
}

/**
 * Updates whether the page with the specified ID will be shown in site navigation
 * @param id The ID of the page to update
 * @param showLink Whether the page will now be shown in site navigation
 */
export async function updatePageShowLinkById(id: number, showLink: boolean) {
    return knex('pages')
        .update({
            page_show_link: showLink
        })
        .where('id', id)
}

/**
 * Deletes the page with the specified ID
 * @param id The page ID
 */
export async function deletePageById(id: number) {
    return knex('pages')
        .del()
        .where('pages.id', id)
}

/**
 * Deletes the pages with the specified IDs
 * @param ids The page IDs
 */
export async function deletePagesByIds(ids: number[]) {
    return knex('pages')
        .del()
        .whereIn('pages.id', ids)
}