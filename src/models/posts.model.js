const config = require('../../knexfile')
const knex = require('knex')(config)
const utils = require('../utils/misc.util')
const commentsModel = require('./comments.model')

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
/**
 * @param {boolean} withContent 
 */
function postInfo(withContent) {
    let query = knex('posts')
        .select('posts.id')
        .select(knex.ref('post_author').as('author'))
        .select(knex.ref('user_username').as('author_username'))
        .select(knex.ref('post_title').as('title'))
        .select(knex.ref('post_slug').as('slug'))
        .select(knex.ref('post_tags').as('tags'))
        .select(knex.ref('post_enable_comments').as('enable_comments'))
        .select(knex.ref('post_published').as('published'))
        .select(knex.ref('post_publish_date').as('publish_date'))
        .select(knex.ref('post_show_title').as('show_title'))
        .select(knex.ref('post_referenced_media').as('referenced_media'))
        .select(knex.ref('post_created_on').as('created_on'))
        .select(knex.raw(`(
            SELECT COUNT(*)
            FROM \`comments\`
            WHERE \`comment_post\` = \`posts\`.\`id\`
            AND \`comment_type\` = ${commentsModel.Type.POST}
        ) AS \`comments\``))
        .leftJoin('users', 'post_author', 'users.id')

    if(withContent)
        query.select(knex.ref('post_content').as('content'))
    
    return query
}

/**
 * @typedef {Object} PostInfo
 * @property {number} id
 * @property {number} author
 * @property {?string} author_username
 * @property {string} title
 * @property {string} slug
 * @property {Array<string>} tags
 * @property {boolean} enable_comments
 * @property {boolean} published
 * @property {?Date} publish_date
 * @property {boolean} show_title
 * @property {Array<number>} referenced_media
 * @property {Date} created_on
 * @property {number} comments
 * @property {?string} content
 */

/**
 * @param {Array<PostInfo>} rows
 */
function processPostInfoRows(rows) {
    for(let row of rows) {
        row.tags = utils.setToArray(row.tags)
        row.enable_comments = !!row.enable_comments
        row.publish_date = new Date(row.publish_date)
        row.show_title = !!row.show_title
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
 * @param {?Date} publishDate The time when the post will be published, or null to be instantly published (still depends on "published" being true, regardless of this value)
 * @param {boolean} showTitle Whether the post title will be visible
 * @param {Array<number>} referencedMedia The media IDs that were referenced/linked/embedded in the post
 */
async function createPost(author, title, slug, content, tags, enableComments, published, publishDate, showTitle, referencedMedia) {
    return knex('posts')
        .insert({
            post_author: author,
            post_title: title,
            post_slug: slug,
            post_content: content,
            post_tags: utils.arrayToSet(tags),
            post_enable_comments: enableComments,
            post_published: published,
            post_publish_date: publishDate,
            post_show_title: showTitle,
            post_referenced_media: utils.arrayToSet(referencedMedia)
        })
}

/**
 * Fetches all posts
 * @param {number} offset The offset to return results
 * @param {number} limit The amount of results to return
 * @param {number} order The order of results to return
 * @return {Promise<Array<Object>>} All posts
 */
async function fetchPosts(offset, limit, order) {
    return knex('posts')
        .select('*')
        .offset(offset)
        .limit(limit)
        .orderByRaw(orderBy(order))
}

/**
 * Fetches all published posts
 * @param {number} offset The offset to return results
 * @param {number} limit The amount of results to return
 * @param {number} order The order of results to return
 * @return {Promise<Array<Object>>} All published posts
 */
async function fetchPublishedPosts(offset, limit, order) {
    return knex('posts')
        .select('*')
        .where('post_published', true)
        .andWhere(function(query) {
            query
                .where('post_publish_date', '<', knex.raw('NOW()'))
                .orWhere('post_publish_date', null)
        })
        .offset(offset)
        .limit(limit)
        .orderByRaw(orderBy(order))
}

/**
 * Fetches info about all posts
 * @param {boolean} withContent Whether to include post content
 * @param {number} offset The offset to return results
 * @param {number} limit The amount of results to return
 * @param {number} order The order of results to return
 * @returns {Promise<Array<PostInfo>>} All posts' info
 */
async function fetchPostInfos(withContent, offset, limit, order) {
    return processPostInfoRows(
        await postInfo(withContent)
            .offset(offset)
            .limit(limit)
            .orderByRaw(orderBy(order))
    )
}

/**
 * Fetches info about all published posts
 * @param {boolean} withContent Whether to include post content
 * @param {number} offset The offset to return results
 * @param {number} limit The amount of results to return
 * @param {number} order The order of results to return
 * @returns {Promise<Array<PostInfo>>} All published posts' info
 */
async function fetchPublishedPostInfos(withContent, offset, limit, order) {
    return processPostInfoRows(
        await postInfo(withContent)
            .where('post_published', true)
            .andWhere(function(query) {
                query
                    .where('post_publish_date', '<', knex.raw('NOW()'))
                    .orWhere('post_publish_date', null)
            })
            .offset(offset)
            .limit(limit)
            .orderByRaw(orderBy(order))
    )
}

/**
 * Fetches info about all published posts by the specific author
 * @param {number} author The user ID of the author
 * @param {boolean} withContent Whether to include post content
 * @param {number} offset The offset to return results
 * @param {number} limit The amount of results to return
 * @param {number} order The order of results to return
 * @returns {Promise<Array<PostInfo>>} All published posts' info
 */
 async function fetchPublishedPostInfosByAuthor(author, withContent, offset, limit, order) {
    return processPostInfoRows(
        await postInfo(withContent)
            .where('post_published', true)
            .andWhere(function(query) {
                query
                    .where('post_publish_date', '<', knex.raw('NOW()'))
                    .orWhere('post_publish_date', null)
            })
            .andWhere('post_author', author)
            .offset(offset)
            .limit(limit)
            .orderByRaw(orderBy(order))
    )
}

/**
 * Fetches a post by its slug
 * @param {string} slug The post slug
 * @returns {Promise<Array<Object>>} An array with the row containing the post or an empty array if none exists
 */
async function fetchPostBySlug(slug) {
    return knex('posts')
        .select('*')
        .where('post_slug', slug)
}

/**
 * Fetches a post's info by its ID
 * @param {boolean} withContent Whether to include post content
 * @param {number} id The post's ID
 * @returns {Promise<Array<PostInfo>>} An array with the row containing the post's info or an empty array if none exists
 */
 async function fetchPostInfoById(withContent, id) {
    return processPostInfoRows(
        await postInfo(withContent)
            .where('posts.id', id)
    )
}

/**
 * Fetches a post's info by its slug
 * @param {boolean} withContent Whether to include post content
 * @param {string} slug The post slug
 * @returns {Promise<Array<PostInfo>>} An array with the row containing the post's info or an empty array if none exists
 */
async function fetchPostInfoBySlug(withContent, slug) {
    return processPostInfoRows(
        await postInfo(withContent)
            .where('post_slug', slug)
    )
}

/**
 * Fetches post infos by their IDs
 * @param {boolean} withContent Whether to include post content
 * @param {Array<number>} ids The IDs
 * @returns {Promise<Array<PostInfo>>} All post infos with the specified IDs
 */
async function fetchPostInfosByIds(withContent, ids) {
    return processPostInfoRows(
        await postInfo(withContent)
            .whereIn('posts.id', ids)
    )
}

/**
 * Fetches info about all published posts with the specified tag
 * @param {string} tag The tag to search for
 * @param {boolean} withContent Whether to include post content
 * @param {number} offset The offset to return results
 * @param {number} limit The amount of results to return
 * @param {number} order The order of results to return
 * @returns {Promise<Array<PostInfo>>} All published posts' info
 */
async function fetchPublishedPostInfosByTag(tag, withContent, offset, limit, order) {
    return processPostInfoRows(
        await postInfo(withContent)
            .where('post_published', true)
            .andWhere(function(query) {
                query
                    .where('post_publish_date', '<', knex.raw('NOW()'))
                    .orWhere('post_publish_date', null)
            })
            .andWhereRaw('FIND_IN_SET(?, `post_tags`) > 0', [tag])
            .offset(offset)
            .limit(limit)
            .orderByRaw(orderBy(order))
    )
}

/**
 * Fetches info about all published posts with titles/contents/tags like the specified pattern
 * @param {string} pattern The pattern
 * @param {boolean} withContent Whether to include post content
 * @param {number} offset The offset to return results
 * @param {number} limit The amount of results to return
 * @param {number} order The order of results to return
 * @returns {Promise<Array<PostInfo>>} All published posts' info with title/contents/tags like the specified pattern
 */
async function fetchPublishedPostInfosWherePostLike(pattern, withContent, offset, limit, order) {
    return processPostInfoRows(
        await postInfo(withContent)
            .where('post_published', true)
            .andWhere(function(query) {
                query
                    .where('post_publish_date', '<', knex.raw('NOW()'))
                    .orWhere('post_publish_date', null)
            })
            .andWhere(function() {
                this
                    .whereRaw('LOWER(`post_title`) LIKE ? ESCAPE \'|\'', [pattern.toLowerCase()])
                    .orWhereRaw('LOWER(`post_content`) LIKE ? ESCAPE \'|\'', [pattern.toLowerCase()])
                    .orWhereRaw('LOWER(`post_tags`) LIKE ? ESCAPE \'|\'', [pattern.toLowerCase()])
            })
            .offset(offset)
            .limit(limit)
            .orderByRaw(orderBy(order))
    )
}

/**
 * Returns the total amount of posts
 * @returns {Promise<number>} The total amount of posts
 */
async function fetchPostsCount() {
    return (await knex('posts').count('*', { as: 'count' }))[0].count
}

/**
 * Fetches the amount of posts with a slug that matches the provided regular expression
 * @param {string} slugRegex The regular expression
 * @returns {Promise<number>} The amount of posts that match the provided regular expression
 */
async function fetchPostCountBySlugRegex(slugRegex) {
    return (await knex('posts')
        .count('*', { as: 'count' })
        .whereRaw('`post_slug` REGEXP ?', [slugRegex]))[0].count
}

/**
 * Fetches the amount of posts with the specified tag
 * @param {string} tag The tag to search for
 * @returns {Promise<number>} The amount of posts with the specified tag
 */
async function fetchPublishedPostCountByTag(tag) {
    return (await knex('posts')
        .count('*', { as: 'count' })
        .where('post_published', true)
        .andWhere(function(query) {
            query
                .where('post_publish_date', '<', knex.raw('NOW()'))
                .orWhere('post_publish_date', null)
        })
        .andWhereRaw('FIND_IN_SET(?, `post_tags`) > 0', [tag]))[0].count
}

/**
 * Fetches the amount of posts with titles/contents/tags like the specified pattern
 * @param {string} pattern The pattern
 * @returns {Promise<number>} The amount of posts with title/contents/tags like the specified pattern
 */
async function fetchPublishedPostCountWherePostLike(pattern) {
    return (await knex('posts')
        .count('*', { as: 'count' })
        .where('post_published', true)
        .andWhere(function(query) {
            query
                .where('post_publish_date', '<', knex.raw('NOW()'))
                .orWhere('post_publish_date', null)
        })
        .andWhere(function() {
            this
                .whereRaw('LOWER(`post_title`) LIKE ? ESCAPE \'|\'', [pattern.toLowerCase()])
                .orWhereRaw('LOWER(`post_content`) LIKE ? ESCAPE \'|\'', [pattern.toLowerCase()])
                .orWhereRaw('LOWER(`post_tags`) LIKE ? ESCAPE \'|\'', [pattern.toLowerCase()])
        }))[0].count
}

/**
 * Fetches the amount of posts with specified author
 * @param {number} author The post author's ID
 * @returns {Promise<number>} The amount of posts with the specified author
 */
async function fetchPublishedPostCountByAuthor(author) {
    return (await knex('posts')
            .count('*', { as: 'count' })
            .where('post_author', author)
            .andWhere('post_published', true)
            .andWhere(function(query) {
                query
                    .where('post_publish_date', '<', knex.raw('NOW()'))
                    .orWhere('post_publish_date', null)
            })
    )[0].count
}

/**
 * Returns rows containing only post tags in a column called "tags"
 * @returns {Promise<Object>} Rows containing only post tags in a column called "tags"
 */
async function fetchPostTags() {
    return knex('posts')
        .select(knex.ref('post_tags').as('tags'))
}

/**
 * Updates the post with the specified ID
 * @param {number} id The ID of the post to update
 * @param {string} title The post's new title
 * @param {string} slug The post's new slug
 * @param {string} content The post's new content
 * @param {Array<string>} tags The post's new tags
 * @param {boolean} enableComments Whether the post will now have comments enabled
 * @param {boolean} published Whether the post will now be published
 * @param {?Date} publishDate The time when the post will be published, or null to be instantly published (still depends on "published" being true, regardless of this value)
 * @param {boolean} showTitle Whether the post will now show its title
 * @param {Array<string>} referencedMedia All media that the post now references
 */
async function updatePostById(id, title, slug, content, tags, enableComments, published, publishDate, showTitle, referencedMedia) {
    return knex('posts')
        .update({
            post_title: title,
            post_slug: slug,
            post_content: content,
            post_tags: utils.arrayToSet(tags),
            post_enable_comments: enableComments,
            post_published: published,
            post_publish_date: publishDate,
            post_show_title: showTitle,
            post_referenced_media: utils.arrayToSet(referencedMedia)
        })
        .where('id', id)
}

/**
 * Deletes the post with the specified ID
 * @param {number} id The post ID
 */
async function deletePostById(id) {
    return knex('posts')
        .del()
        .where('posts.id', id)
}

/**
 * Deletes the posts with the specified IDs
 * @param {Array<number>} ids The post IDs
 */
async function deletePostsByIds(ids) {
    return knex('posts')
        .del()
        .whereIn('posts.id', ids)
}

/* Export functions */
module.exports.createPost = createPost
module.exports.fetchPosts = fetchPosts
module.exports.fetchPublishedPosts = fetchPublishedPosts
module.exports.fetchPostInfos = fetchPostInfos
module.exports.fetchPublishedPostInfos = fetchPublishedPostInfos
module.exports.fetchPublishedPostInfosByAuthor = fetchPublishedPostInfosByAuthor
module.exports.fetchPostBySlug = fetchPostBySlug
module.exports.fetchPostInfoById = fetchPostInfoById
module.exports.fetchPostInfoBySlug = fetchPostInfoBySlug
module.exports.fetchPostInfosByIds = fetchPostInfosByIds
module.exports.fetchPublishedPostInfosByTag = fetchPublishedPostInfosByTag
module.exports.fetchPublishedPostInfosWherePostLike = fetchPublishedPostInfosWherePostLike
module.exports.fetchPostsCount = fetchPostsCount
module.exports.fetchPostCountBySlugRegex = fetchPostCountBySlugRegex
module.exports.fetchPublishedPostCountByTag = fetchPublishedPostCountByTag
module.exports.fetchPublishedPostCountWherePostLike = fetchPublishedPostCountWherePostLike
module.exports.fetchPublishedPostCountByAuthor = fetchPublishedPostCountByAuthor
module.exports.fetchPostTags = fetchPostTags
module.exports.updatePostById = updatePostById
module.exports.deletePostById = deletePostById
module.exports.deletePostsByIds = deletePostsByIds

/* Export values */
module.exports.Order = Order