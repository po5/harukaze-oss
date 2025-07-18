import config from '../../knexfile'
import Knex, { Knex as KnexType } from 'knex'
import { fetchPostInfoById } from 'models/posts.model'

const knex = Knex(config)

/**
 * Info about a comment
 */
export type CommentInfo = {
    /**
     * The comment ID
     */
    id: number,

    /**
     * The post/booru item/page that the comment was left on
     */
    post: number,

    /**
     * The comment parent's ID, or null if not a reply
     */
    parent: number | null,

    /**
     * The comment author's ID
     */
    author: number,
    /**
     * The comment author's username
     */
    author_username: string | null,
    /**
     * The comment author's character ID
     */
    author_character: number | null,

    /**
     * The comment content
     */
    content: string,

    /**
     * The comment mood's ID
     */
    mood: number,

    /**
     * The comment mood's name
     */
    mood_name: string | null,

    /**
     * The comment type
     */
    type: CommentType

    /**
     * The comment post title.
     * Represents media title if comment type is BOORU.
     * Represents page title if comment type is PAGE.
     */
    post_title: string | null,
    /**
     * The comment post slug.
     * Represents media ID if comment type is BOORU.
     * Represents page slug if comment type is PAGE.
     */
    post_slug: string | null,

    /**
     * The date the comment was created on
     */
    created_on: Date
}

/**
 * Orders comment results can be returned in
 */
export enum CommentOrder {
    /**
     * Creation time, ascending
     */
    CREATED_ASC,
    /**
     * Creation time, descending
     */
    CREATED_DESC
}

/**
 * Comment avatar moods
 */
export enum Mood {
    /**
     * Default
     */
    DEFAULT,

    /**
     * Cheering
     */
    CHEER,

    /**
     * Horny
     */
    HORNY,

    /**
     * Mad
     */
    MAD,

    /**
     * OMG
     */
    OMG,

    /**
     * Sad
     */
    SAD,

    /**
     * Scared
     */
    SCARE,

    /**
     * Yay
     */
    YAY,

    /**
     * Yuck
     */
    YUCK
}

/**
 * Comment types
 */
export enum CommentType {
    /**
     * Post comment
     */
    POST,

    /**
     * Booru item comment
     */
    BOORU,

    /**
     * Page comment
     */
    PAGE
}

/* Utility functions */
function commentInfo(type: CommentType | null): KnexType.QueryInterface {
    const query = knex('comments')
        .select('comments.id')
        .select(knex.ref('comment_post').as('post'))
        .select(knex.ref('comment_parent').as('parent'))
        .select(knex.ref('comment_author').as('author'))
        .select(knex.ref('user_username').as('author_username'))
        .select(knex.ref('user_character').as('author_character'))
        .select(knex.ref('comment_content').as('content'))
        .select(knex.ref('comment_mood').as('mood'))
        .select('mood_name')
        .select(knex.ref('comment_type').as('type'))
        .select(knex.ref('comment_created_on').as('created_on'))
        .leftJoin('users', 'comment_author', 'users.id')
        .leftJoin('moods', 'comment_mood', 'moods.id')

    // Select post or media info, depending on which type is specified
    // If no type is specified, use a less performant method that can detect it dynamically
    if(type === CommentType.POST)
        query
            .select('post_title')
            .select('post_slug')
            .leftJoin('posts', 'comment_post', 'posts.id')
    else if(type === CommentType.BOORU)
        query
            .select(knex.ref('media_title').as('post_title'))
            .select(knex.ref('media.id').as('post_slug'))
            .leftJoin('media', 'comment_post', 'media.id')
    //else if(type === CommentType.PAGE)
        // TODO Implement page comments
    else
        // If no type is provided, don't fetch post_title and post_slug
        // We could fetch them using subqueries, but it would be slow
        query
            .select(knex.raw('NULL AS post_title'))
            .select(knex.raw('NULL AS post_slug'))

    return query
}
/**
 * @param rows
 */
async function processCommentInfoRows(rows: any[]): Promise<CommentInfo[]> {
    for(const row of rows) {
        row.created_on = new Date(row.created_on)
        if(row.post_slug === null && row.type === CommentType.POST) {
            const [ post ] = await fetchPostInfoById(false, row.post)
            if (post) {
                row.post_slug = post.slug
                row.post_title = post.title
            }
        }
    }
    return rows
}
/**
 * @param order
 */
function orderBy(order: CommentOrder): string {
    switch(order) {
    case CommentOrder.CREATED_DESC:
        return 'comments.comment_created_on DESC'
    default:
        return 'comments.comment_created_on ASC'
    }
}

/**
 * Creates a new comment
 * @param post The ID of the post/booru item/page this comment was made on
 * @param parent The ID of the comment this is in reply to (should be null if not a reply)
 * @param author The ID of the comment author
 * @param content The comment's content
 * @param mood The comment's mood type
 * @param type The comment's type
 */
export async function createComment(post: number, parent: number | null, author: number, content: string, mood: number, type: CommentType) {
    return knex('comments')
        .insert({
            comment_post: post,
            comment_parent: parent,
            comment_author: author,
            comment_content: content,
            comment_mood: mood,
            comment_type: type
        })
}

/**
 * Fetches all comments' info
 * @param type The type of comments, or null for all
 * @param offset The offset to return results
 * @param limit The amount of results to return
 * @param order The order of results to return
 * @returns All comments' info
 */
export async function fetchCommentInfos(type: CommentType | null, offset: number, limit: number, order: CommentOrder): Promise<CommentInfo[]> {
    return await processCommentInfoRows(
        await commentInfo(type)
            .offset(offset)
            .limit(limit)
            .orderByRaw(orderBy(order))
    )
}

/**
 * Fetches normal (non-reply) comments' info on the specified post with the specified type
 * @param post The post ID
 * @param type The type of comment
 * @param offset The offset to return results
 * @param limit The amount of results to return
 * @param order The order of results to return
 * @returns All normal comments' info
 */
export async function fetchNormalCommentInfosByPost(post: number, type: CommentType, offset: number, limit: number, order: CommentOrder): Promise<CommentInfo[]> {
    return await processCommentInfoRows(
        await commentInfo(type)
            .whereNull('comment_parent')
            .andWhere('comment_post', post)
            .andWhere('comment_type', type)
            .offset(offset)
            .limit(limit)
            .orderByRaw(orderBy(order))
    )
}

/**
 * Fetches all reply comments' info on the specified parent comment IDs
 * @param ids The comment parent IDs
 * @param type The type of comments to fetch (used to fetch info about the post/booru item/page, provide null to not fetch that info)
 * @returns All reply comments' info
 */
export async function fetchReplyCommentsByParentIds(ids: number[], type: CommentType | null = null): Promise<CommentInfo[]> {
    return await processCommentInfoRows(
        await commentInfo(type)
            .whereIn('comment_parent', ids)
    )
}

/**
 * Fetches a comment's info by its ID
 * @param id The ID
 * @param type The type of comment to fetch (used to fetch info about the post/booru item/page, provide null to not fetch that info)
 * @returns An array with the row containing the comment's info or an empty array if none exists
 */
export async function fetchCommentInfoById(id: number, type: CommentType | null = null): Promise<[ CommentInfo? ]> {
    return await processCommentInfoRows(
        await commentInfo(type)
            .where('comments.id', id)
    ) as [ CommentInfo? ]
}

/**
 * Fetches a normal (non-reply) comment by its ID (raw)
 * @param id The comment ID
 * @returns An array with the row containing the comment or an empty array if none exists
 */
export async function fetchNormalCommentById(id: number): Promise<any> {
    return knex('comments')
        .select('*')
        .whereNull('comment_parent')
        .andWhere('comments.id', id)
}

/**
 * Returns the total amount of comments
 * @returns The total amount of comments
 */
export async function fetchCommentsCount(): Promise<number> {
    return (await knex('comments')
        .count('*', { as: 'count' })
    )[0].count as number
}

/**
 * Returns the total amount of comments on a post
 * @param post The post ID
 * @param type The comment type
 * @returns The total amount of comments on the specified post
 */
export async function fetchCommentsCountByPost(post: number, type: CommentType): Promise<number> {
    return (await knex('comments')
        .count('*', { as: 'count' })
        .where('comment_post', post)
        .andWhere('comment_type', type)
    )[0].count as number
}

/**
 * Returns the total amount of normal (non-reply) comments on a post
 * @param post The post ID
 * @param type The comment type
 * @returns The total amount of comments on the specified post
 */
export async function fetchNormalCommentsCountByPost(post: number, type: CommentType): Promise<number> {
    return (await knex('comments')
            .count('*', { as: 'count' })
            .whereNull('comment_parent')
            .andWhere('comment_post', post)
            .andWhere('comment_type', type)
    )[0].count as number
}

/**
 * Deletes a comment by its ID
 * @param id The ID
 */
export async function deleteCommentById(id: number) {
    return knex('comments')
        .del()
        .where('id', id)
}

/**
 * Deletes comments by their IDs
 * @param ids The IDs
 */
export async function deleteCommentsByIds(ids: number[]) {
    return knex('comments')
        .del()
        .whereIn('id', ids)
}

/**
 * Deletes all comments by the specified author ID
 * @param author The author's ID
 */
export async function deleteCommentsByAuthor(author: string) {
    return knex('comments')
        .del()
        .where('comment_author', author)
}

/**
 * Deletes all comments with the specified post IDs, and of the specified type
 * @param ids The post IDs
 * @param type The type of comments to delete
 */
export async function deleteCommentsByPostIds(ids: number[], type: CommentType) {
    return knex('comments')
        .del()
        .whereIn('comment_post', ids)
        .andWhere('comment_type', type)
}
