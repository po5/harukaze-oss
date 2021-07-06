const config = require('../../knexfile')
const knex = require('knex')(config)
const { characterMoodToUrl } = require('../utils/reacts.util')

/**
 * Orders comment results can be returned in
 */
 const Order = {
    /**
     * Creation time, ascending
     */
    CREATED_ASC: 0,
    /**
     * Creation time, descending
     */
    CREATED_DESC: 1
}

/**
 * Comment avatar moods
 */
const Mood = {
    /**
     * Default
     */
    DEFAULT: 0,
    /**
     * Cheering
     */
    CHEER: 1,
    /**
     * Horny
     */
    HORNY: 2,
    /**
     * Mad
     */
    MAD: 3,
    /**
     * OMG
     */
    OMG: 4,
    /**
     * Sad
     */
    SAD: 5,
    /**
     * Scared
     */
    SCARE: 6,
    /**
     * Yay
     */
    YAY: 7,
    /**
     * Yuck
     */
    YUCK: 8
}

/* Utility functions */
function commentInfo() {
    let query = knex('comments')
        .select('comments.id')
        .select(knex.ref('comment_post').as('post'))
        .select('post_title')
        .select('post_slug')
        .select(knex.ref('comment_parent').as('parent'))
        .select(knex.ref('comment_author').as('author'))
        .select(knex.ref('user_username').as('author_username'))
        .select(knex.ref('user_character').as('author_character'))
        .select(knex.ref('comment_content').as('content'))
        .select(knex.ref('comment_mood').as('mood'))
        .select(knex.ref('comment_created_on').as('created_on'))
        .leftJoin('users', 'comment_author', 'users.id')
        .leftJoin('posts', 'comment_post', 'posts.id')
    
    return query
}
/**
 * @param {Array<Object>} rows 
 */
function processCommentInfoRows(rows) {
    for(row of rows) {
        row.created_on = new Date(row.created_on)
        row.author_character_url = characterMoodToUrl(row.mood, row.author_character)
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
        return '`comments`.`comment_created_on` DESC'
    default:
        return '`comments`.`comment_created_on` ASC'
    }
}

/**
 * Creates a new comment
 * @param {number} post The ID of the post this comment was made on
 * @param {number} parent The ID of the comment this is in reply to (should be null if not a reply)
 * @param {number} author The ID of the comment author
 * @param {string} content The comment's content
 * @param {number} mood The comment's mood type
 */
async function createComment(post, parent, author, content, mood) {
    return await knex('comments')
        .insert({
            comment_post: post,
            comment_parent: parent,
            comment_author: author,
            comment_content: content,
            comment_mood: mood
        })
}

/**
 * Fetches all comments
 * @param {number} offset The offset to return results
 * @param {number} limit The amount of results to return
 * @param {number} order The order of results to return
 * @returns {Array<Object>} All comments' info
 */
 async function fetchCommentInfos(offset, limit, order) {
    return processCommentInfoRows(
        await commentInfo()
            .offset(offset)
            .limit(limit)
            .orderByRaw(orderBy(order))
    )
}

/**
 * Fetches normal (non-reply) comments on the specified post
 * @param {number} post The post ID
 * @param {number} offset The offset to return results
 * @param {number} limit The amount of results to return
 * @param {number} order The order of results to return
 * @returns {Array<Object>} All normal comments' info
 */
async function fetchNormalCommentInfosByPost(post, offset, limit, order) {
    return processCommentInfoRows(
        await commentInfo()
            .whereNull('comment_parent')
            .where('comment_post', post)
            .offset(offset)
            .limit(limit)
            .orderByRaw(orderBy(order))
    )
}

/**
 * Fetches all reply comments on the specified parent comment IDs
 * @param {Array<number>} ids The comment parent IDs
 * @returns {Array<Object>} All reply comments' info
 */
async function fetchReplyCommentsByParentIds(ids) {
    return processCommentInfoRows(
        await commentInfo()
            .whereIn('comment_parent', ids)
    )
}

/**
 * Fetches a comment's info by its ID
 * @param {number} id The ID
 * @returns {Array<Object>} An array with the row containing the comment's info or an empty array if none exists
 */
async function fetchCommentInfoById(id) {
    return processCommentInfoRows(
        await commentInfo()
            .where('comments.id', id)
    )
}

/**
 * Fetches a normal comment by its ID
 * @param {number} id The comment ID
 * @returns {Array<Object>} An array with the row containing the comment or an empty array if none exists
 */
async function fetchNormalCommentById(id) {
    return await knex('comments')
        .select('*')
        .whereNull('comment_parent')
        .andWhere('comments.id', id)
}

/**
 * Returns the total amount of comments
 * @returns {number} The total amount of comments
 */
 async function fetchCommentsCount() {
    return (await knex('comments')
        .count('*', { as: 'count' })
    )[0].count
}

/**
 * Returns the total amount of comments on a post
 * @param {number} post The post ID
 * @returns {number} The total amount of comments on the specified post
 */
async function fetchCommentsCountByPost(post) {
    return (await knex('comments')
        .count('*', { as: 'count' })
        .where('comment_post', post)
    )[0].count
}

/**
 * Deletes a comment by its ID
 * @param {number} id The ID
 */
async function deleteCommentById(id) {
    return await knex('comments')
        .del()
        .where('id', id)
}

/**
 * Deletes comments by their IDs
 * @param {Array<number>} ids The IDs
 */
async function deleteCommentsByIds(ids) {
    return await knex('comments')
        .del()
        .whereIn('ids', ids)
}

/**
 * Deletes all comments by the specified author ID
 * @param {number} author The author's ID
 */
async function deleteCommentsByAuthor(author) {
    return await knex('comments')
        .del()
        .where('comment_author', author)
}

/**
 * Deletes all comments with the specified parent
 * @param {number} parent The parent comment ID
 */
async function deleteCommentsByParent(parent) {
    return await knex('comments')
        .del()
        .where('comment_parent', parent)
}

/* Export functions */
module.exports.createComment = createComment
module.exports.fetchCommentInfos = fetchCommentInfos
module.exports.fetchNormalCommentInfosByPost = fetchNormalCommentInfosByPost
module.exports.fetchReplyCommentsByParentIds = fetchReplyCommentsByParentIds
module.exports.fetchCommentInfoById = fetchCommentInfoById
module.exports.fetchNormalCommentById = fetchNormalCommentById
module.exports.fetchCommentsCount = fetchCommentsCount
module.exports.fetchCommentsCountByPost = fetchCommentsCountByPost
module.exports.deleteCommentById = deleteCommentById
module.exports.deleteCommentsByIds = deleteCommentsByIds
module.exports.deleteCommentsByAuthor = deleteCommentsByAuthor
module.exports.deleteCommentsByParent = deleteCommentsByParent

/* Export values */
module.exports.Order = Order
module.exports.Mood = Mood