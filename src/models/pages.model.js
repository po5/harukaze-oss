const config = require('../../knexfile')
const knex = require('knex')(config)

/**
 * Orders page results can be returned in
 */
const Order = {
    /**
     * Creation time, ascending
     */
    CREATED_ASC: 0,
    /**
     * Creation time, descending
     */
    CREATED_DESC: 1,
    /**
     * Title alphabetically, ascending
     */
    TITLE_ASC: 2,
    /**
     * Title alphabetically, descending
     */
    TITLE_DESC: 3
}

/* Utility functions */
/**
 * @param {boolean} withContent 
 */
function pageInfo(withContent) {
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
 * @typedef {Object} PageInfo
 * @property {number} id
 * @property {number} creator
 * @property {?string} creator_username
 * @property {string} title
 * @property {string} slug
 * @property {boolean} show_link
 * @property {Date} created_on
 * @property {?string} content
 */

/**
 * @param {Array<PageInfo>} rows
 */
function processPageInfoRows(rows) {
    for(let row of rows) {
        row.show_link = !!row.show_link
        row.created_on = new Date(row.created_on)
    }
    return rows
}
/**
 * @param {number} order 
 * @returns {string}
 */
function orderBy(order) {
    switch(order) {
    case Order.CREATED_DESC:
        return '`pages`.`page_created_on` DESC'
    case Order.TITLE_ASC:
        return '`pages`.`page_title` ASC'
    case Order.TITLE_DESC:
        return '`pages`.`page_title` DESC'
    default:
        return '`pages`.`page_created_on` ASC'
    }
}

/**
 * Creates a new page
 * @param {number} creator The creator's ID
 * @param {string} title The title
 * @param {string} slug The page slug (used in URLs, like "/page/my-cool-page" if your title is "My Cool Page")
 * @param {string} content The content
 * @param {boolean} showLink Whether the page's link should be shown in the site's navigation
 */
async function createPage(creator, title, slug, content, showLink) {
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
 * Fetches all pages
 * @param {number} offset The offset to return results
 * @param {number} limit The amount of results to return
 * @param {number} order The order of results to return
 * @return {Promise<Array<Object>>} All pages
 */
async function fetchPages(offset, limit, order) {
    return knex('pages')
        .select('*')
        .offset(offset)
        .limit(limit)
        .orderByRaw(orderBy(order))
}

/**
 * Fetches all link-shown pages
 * @param {number} offset The offset to return results
 * @param {number} limit The amount of results to return
 * @param {number} order The order of results to return
 * @return {Promise<Array<Object>>} All link-shown pags
 */
async function fetchLinkShownPages(offset, limit, order) {
    return knex('pages')
        .select('*')
        .where('page_show_link', true)
        .offset(offset)
        .limit(limit)
        .orderByRaw(orderBy(order))
}

/**
 * Fetches info about all pages
 * @param {boolean} withContent Whether to include page content
 * @param {number} offset The offset to return results
 * @param {number} limit The amount of results to return
 * @param {number} order The order of results to return
 * @returns {Promise<Array<PageInfo>>} All pages' info
 */
async function fetchPageInfos(withContent, offset, limit, order) {
    return processPageInfoRows(
        await pageInfo(withContent)
            .offset(offset)
            .limit(limit)
            .orderByRaw(orderBy(order))
    )
}

/**
 * Fetches info about all link-shown pages
 * @param {boolean} withContent Whether to include page content
 * @param {number} offset The offset to return results
 * @param {number} limit The amount of results to return
 * @param {number} order The order of results to return
 * @returns {Promise<Array<PageInfo>>} All link-shown pages' info
 */
async function fetchLinkShownPageInfos(withContent, offset, limit, order) {
    return processPageInfoRows(
        await pageInfo(withContent)
            .where('page_show_link', true)
            .offset(offset)
            .limit(limit)
            .orderByRaw(orderBy(order))
    )
}

/**
 * Fetches a page by its slug
 * @param {string} slug The page slug
 * @returns {Promise<Array<Object>>} An array with the row containing the page or an empty array if none exists
 */
async function fetchPageBySlug(slug) {
    return knex('pages')
        .select('*')
        .where('page_slug', slug)
}

/**
 * Fetches a page's info by its ID
 * @param {boolean} withContent Whether to include page content
 * @param {number} id The page's ID
 * @returns {Promise<Array<PageInfo>>} An array with the row containing the page's info or an empty array if none exists
 */
 async function fetchPageInfoById(withContent, id) {
    return processPageInfoRows(
        await pageInfo(withContent)
            .where('pages.id', id)
    )
}

/**
 * Fetches a page's info by its slug
 * @param {boolean} withContent Whether to include page content
 * @param {string} slug The page slug
 * @returns {Promise<Array<PageInfo>>} An array with the row containing the page's info or an empty array if none exists
 */
async function fetchPageInfoBySlug(withContent, slug) {
    return processPageInfoRows(
        await pageInfo(withContent)
            .where('page_slug', slug)
    )
}

/**
 * Fetches page infos by their IDs
 * @param {boolean} withContent Whether to include page content
 * @param {Array<number>} ids The IDs
 * @returns {Promise<Array<PageInfo>>} All page infos with the specified IDs
 */
async function fetchPageInfosByIds(withContent, ids) {
    return processPageInfoRows(
        await pageInfo(withContent)
            .whereIn('pages.id', ids)
    )
}

/**
 * Returns the total amount of pages
 * @returns {Promise<number>} The total amount of pages
 */
async function fetchPageCount() {
    return (await knex('pages').count('*', { as: 'count' }))[0].count
}

/**
 * Fetches the amount of pages with a slug that matches the provided regular expression
 * @param {string} slugRegex The regular expression
 * @returns {Promise<number>} The amount of pages with a slug that matches the provided regular expression
 */
async function fetchPageCountBySlugRegex(slugRegex) {
    return (await knex('pages')
        .count('*', { as: 'count' })
        .whereRaw('`page_slug` REGEXP ?', [slugRegex]))[0].count
}

/**
 * Updates the page with the specified ID
 * @param {number} id The ID of the page to update
 * @param {string} title The page's new title
 * @param {string} slug The page's new slug
 * @param {string} content The page's new content
 * @param {boolean} showLink Whether the page will now be shown in site navigation
 */
async function updatePageById(id, title, slug, content, showLink) {
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
 * @param {number} id The ID of the page to update
 * @param {boolean} showLink Whether the page will now be shown in site navigation
 */
async function updatePageShowLinkById(id, showLink) {
    return knex('pages')
        .update({
            page_show_link: showLink
        })
        .where('id', id)
}

/**
 * Deletes the page with the specified ID
 * @param {number} id The page ID
 */
async function deletePageById(id) {
    return knex('pages')
        .del()
        .where('pages.id', id)
}

/**
 * Deletes the pages with the specified IDs
 * @param {Array<number>} ids The page IDs
 */
async function deletePagesByIds(ids) {
    return knex('pages')
        .del()
        .whereIn('pages.id', ids)
}

/* Export functions */
module.exports.createPage = createPage
module.exports.fetchPages = fetchPages
module.exports.fetchLinkShownPages = fetchLinkShownPages
module.exports.fetchPageInfos = fetchPageInfos
module.exports.fetchLinkShownPageInfos = fetchLinkShownPageInfos
module.exports.fetchPageBySlug = fetchPageBySlug
module.exports.fetchPageInfoById = fetchPageInfoById
module.exports.fetchPageInfoBySlug = fetchPageInfoBySlug
module.exports.fetchPageInfosByIds = fetchPageInfosByIds
module.exports.fetchPageCount = fetchPageCount
module.exports.fetchPageCountBySlugRegex = fetchPageCountBySlugRegex
module.exports.updatePageById = updatePageById
module.exports.updatePageShowLinkById = updatePageShowLinkById
module.exports.deletePageById = deletePageById
module.exports.deletePagesByIds = deletePagesByIds

/* Export values */
module.exports.Order = Order