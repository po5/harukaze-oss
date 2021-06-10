const config = require('../../knexfile')
const knex = require('knex')(config)
const utils = require('../utils/misc.util')
const { Knex } = require('knex')

/* Utility functions */
/**
 * @return {Knex}
 */
function postInfo() {
    return knex('posts')
        .select(knex.ref('post_author').as('author'))
        .select(knex.ref('post_title').as('title'))
        .select(knex.ref('post_slug').as('slug'))
        .select(knex.ref('post_tags').as('tags'))
        .select(knex.ref('post_enable_comments').as('enable_comments'))
        .select(knex.ref('post_referenced_media').as('referenced_media'))
        .select(knex.ref('post_created_on').as('created_on'))
}
function processPostInfoRows(rows) {
    for(row of rows) {
        row.tags = utils.setToArray(row.tags)
        row.referenced_media = utils.setToArray(row.referenced_media)
        row.created_on = new Date(row.created_on)
    }
    return rows
}

/**
 * Creates a new post
 * @param {number} author The author's ID
 * @param {string} title The title
 * @param {string} slug The post slug (used in URLs, like "/post/my-cool-post" if your title is "My Cool Post")
 * @param {string} content The content
 * @param {Array<string>} tags The post's tags
 * @param {boolean} enableComments Whether this post has comments enabled
 * @param {Array<number>} referencedMedia The media IDs that were referenced/linked/embedded in the post
 */
async function createPost(author, title, slug, content, tags, enableComments, referencedMedia) {
    return await knex('posts')
        .insert({
            post_author: author,
            post_title: title,
            post_slug: slug,
            post_content: content,
            post_tags: utils.arrayToSet(tags),
            post_enable_comments: enableComments,
            post_referenced_media: referencedMedia
        })
}

/**
 * Fetches all posts
 * @param {number} offset The offset to return results
 * @param {number} limit The amount of results to return
 * @return {Array<Object>} All posts
 */
async function fetchPosts(offset, limit) {
    return await knex('posts')
        .select('*')
        .offset(offset)
        .limit(limit)
}

/**
 * Fetches info about all posts
 * @param {number} offset The offset to return results
 * @param {number} limit The amount of results to return
 * @returns {Array<Object>} All posts' info
 */
async function fetchPostInfos(offset, limit) {
    return processPostInfoRows(
        await postInfo()
            .offset(offset)
            .limit(limit)
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

/* Export functions */
module.exports.createPost = createPost
module.exports.fetchPosts = fetchPosts
module.exports.fetchPostInfos = fetchPostInfos
module.exports.fetchPostBySlug = fetchPostBySlug
module.exports.fetchPostInfoBySlug = fetchPostInfoBySlug
module.exports.fetchPostsCount = fetchPostsCount