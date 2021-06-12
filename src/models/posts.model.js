const config = require('../../knexfile')
const knex = require('knex')(config)
const utils = require('../utils/misc.util')
const { Knex } = require('knex')

/**
 * Orders post results can be returned in
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
function postInfo() {
    return knex('posts')
        .select(knex.ref('post_author').as('author'))
        .select(knex.ref('user_username').as('author_username'))
        .select(knex.ref('post_title').as('title'))
        .select(knex.ref('post_slug').as('slug'))
        .select(knex.ref('post_tags').as('tags'))
        .select(knex.ref('post_enable_comments').as('enable_comments'))
        .select(knex.ref('post_published').as('published'))
        .select(knex.ref('post_referenced_media').as('referenced_media'))
        .select(knex.ref('post_created_on').as('created_on'))
        .select(knex.raw(`(
            SELECT COUNT(*)
            FROM \`comments\`
            WHERE \`comment_post\` = \`posts\`.\`id\`
        ) AS \`comments\``))
        .leftJoin('users', 'post_author', 'users.id')
}
/**
 * @param {Array<Object>} rows 
 */
function processPostInfoRows(rows) {
    for(row of rows) {
        row.tags = utils.setToArray(row.tags)
        row.referenced_media = utils.setToArray(row.referenced_media)
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
        return '`posts`.`post_created_on` DESC'
    case Order.TITLE_ASC:
        return '`posts`.`post_title` ASC'
    case Order.TITLE_DESC:
        return '`posts`.`post_title` DESC'
    default:
        return '`posts`.`post_created_on` ASC'
    }
}

/**
 * Creates a new post
 * @param {number} author The author's ID
 * @param {string} title The title
 * @param {string} slug The post slug (used in URLs, like "/post/my-cool-post" if your title is "My Cool Post")
 * @param {string} content The content
 * @param {Array<string>} tags The post's tags
 * @param {boolean} enableComments Whether this post has comments enabled
 * @param {boolean} published Whether the post is published
 * @param {Array<number>} referencedMedia The media IDs that were referenced/linked/embedded in the post
 */
async function createPost(author, title, slug, content, tags, enableComments, published, referencedMedia) {
    return await knex('posts')
        .insert({
            post_author: author,
            post_title: title,
            post_slug: slug,
            post_content: content,
            post_tags: utils.arrayToSet(tags),
            post_enable_comments: enableComments,
            post_published: published,
            post_referenced_media: utils.arrayToSet(referencedMedia)
        })
}

/**
 * Fetches all posts
 * @param {number} offset The offset to return results
 * @param {number} limit The amount of results to return
 * @param {number} order The order of results to return
 * @return {Array<Object>} All posts
 */
async function fetchPosts(offset, limit, order) {
    return await knex('posts')
        .select('*')
        .offset(offset)
        .limit(limit)
        .orderByRaw(orderBy(order))
}

/**
 * Fetches info about all posts
 * @param {number} offset The offset to return results
 * @param {number} limit The amount of results to return
 * @param {number} order The order of results to return
 * @returns {Array<Object>} All posts' info
 */
async function fetchPostInfos(offset, limit, order) {
    return processPostInfoRows(
        await postInfo()
            .offset(offset)
            .limit(limit)
            .orderByRaw(orderBy(order))
    )
}

/**
 * Fetches a post by its slug
 * @param {string} slug The post slug
 * @returns {Array<Object>} An array with the row containing the post or an empty array if none exists
 */
async function fetchPostBySlug(slug) {
    return await knex('posts')
        .select('*')
        .where('post_slug', slug)
}

/**
 * Fetches a post's info by its slug
 * @param {string} slug The post slug
 * @returns {Array<Object>} An array with the row containing the post's info or an empty array if none exists
 */
async function fetchPostInfoBySlug(slug) {
    return processPostInfoRows(
        await postInfo()
            .where('post_slug', slug)
    )
}

/**
 * Returns the total amount of posts
 * @returns {number} The total amount of posts
 */
async function fetchPostsCount() {
    return (await knex('posts').count('*', { as: 'count' }))[0].count
}

/**
 * Fetches the amount of posts with a slug that matches the provided regular expression
 * @param {string} slugRegex The regular expression
 * @returns {number} The amount of posts that match the provided regular expression
 */
async function fetchPostCountBySlugRegex(slugRegex) {
    return (await knex('posts')
        .count('*', { as: 'count' })
        .whereRaw('`post_slug` REGEXP ?', [slugRegex]))[0].count
}

/* Export functions */
module.exports.createPost = createPost
module.exports.fetchPosts = fetchPosts
module.exports.fetchPostInfos = fetchPostInfos
module.exports.fetchPostBySlug = fetchPostBySlug
module.exports.fetchPostInfoBySlug = fetchPostInfoBySlug
module.exports.fetchPostsCount = fetchPostsCount
module.exports.fetchPostCountBySlugRegex = fetchPostCountBySlugRegex

/* Export values */
module.exports.Order = Order