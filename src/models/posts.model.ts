import config from '../../knexfile'
import Knex, { Knex as KnexType } from 'knex'
import { arrayToSet, setToArray } from 'utils/misc.util'
import { CommentType } from 'models/comments.model'

const knex = Knex(config)

/**
 * Info about a post
 */
export interface PostInfo {
    /**
     * The post ID
     */
    id: number

    /**
     * The post author's ID
     */
    author: number

    /**
     * The post author's username
     */
    author_username: string | null

    /**
     * The post's title
     */
    title: string

    /**
     * The post slug
     */
    slug: string

    /**
     * The post's tags
     */
    tags: string[]

    /**
     * Whether comments are enabled on the post
     */
    enable_comments: boolean

    /**
     * Whether the post is published
     */
    published: boolean

    /**
     * The time when the post will be published, or null to be instantly published (still depends on "published" being true, regardless of this value)
     */
    publish_date: Date | null

    /**
     * Whether the post title is visible
     */
    show_title: boolean

    /**
     * IDs of referenced media in the post.
     * @deprecated This may be used in some places, but for the most part it is obsolete
     */
    referenced_media: number[]

    /**
     * The total number of comments on the post (including replies)
     */
    comments: number

    /**
     * The post content, or null if not included
     */
    content: string | null

    /**
     * The date the post was created on
     */
    created_on: Date
}

/**
 * Orders post results can be returned in
 */
export enum PostOrder {
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
function postInfo(withContent: boolean): KnexType.QueryInterface {
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
            FROM comments
            WHERE comment_post = posts.id
            AND comment_type = ?
        ) AS comments`, [ CommentType.POST ]))
        .leftJoin('users', 'post_author', 'users.id')

    if(withContent)
        query.select(knex.ref('post_content').as('content'))
    
    return query
}

/**
 * @param rows
 */
function processPostInfoRows(rows: any[]): PostInfo[] {
    for(const row of rows) {
        row.tags = setToArray(row.tags)
        row.enable_comments = !!row.enable_comments
        if (row.publish_date !== null)
            row.publish_date = new Date(row.publish_date)
        row.show_title = !!row.show_title
        row.referenced_media = setToArray(row.referenced_media)
        row.created_on = new Date(row.created_on)
    }
    return rows
}
/**
 * @param order
 */
function orderBy(order: PostOrder): string {
    switch(order) {
    case PostOrder.CREATED_DESC:
        return 'posts.post_created_on DESC'
    case PostOrder.TITLE_ASC:
        return 'posts.post_title ASC'
    case PostOrder.TITLE_DESC:
        return 'posts.post_title DESC'
    default:
        return 'posts.post_created_on ASC'
    }
}

/**
 * Creates a new post
 * @param author The author's ID
 * @param title The title
 * @param slug The post slug (used in URLs, like "/post/my-cool-post" if your title is "My Cool Post")
 * @param content The content
 * @param tags The post's tags
 * @param enableComments Whether this post has comments enabled
 * @param published Whether the post is published
 * @param publishDate The time when the post will be published, or null to be instantly published (still depends on "published" being true, regardless of this value)
 * @param showTitle Whether the post title will be visible
 * @param referencedMedia The media IDs that were referenced/linked/embedded in the post (obsolete)
 */
export async function createPost(
    author: number,
    title: string,
    slug: string,
    content: string,
    tags: string[],
    enableComments: boolean,
    published: boolean,
    publishDate: Date | null,
    showTitle: boolean,
    referencedMedia: number[] = []
) {
    return knex('posts')
        .insert({
            post_author: author,
            post_title: title,
            post_slug: slug,
            post_content: content,
            post_tags: arrayToSet(tags),
            post_enable_comments: enableComments,
            post_published: published,
            post_publish_date: publishDate,
            post_show_title: showTitle,
            post_referenced_media: arrayToSet(referencedMedia.map(id => id.toString()))
        })
}

/**
 * Fetches all posts (raw)
 * @param offset The offset to return results
 * @param limit The amount of results to return
 * @param order The order of results to return
 * @returns All posts
 */
export async function fetchPosts(offset: number, limit: number, order: PostOrder): Promise<any[]> {
    return knex('posts')
        .select('*')
        .offset(offset)
        .limit(limit)
        .orderByRaw(orderBy(order))
}

/**
 * Fetches all published posts (raw)
 * @param offset The offset to return results
 * @param limit The amount of results to return
 * @param order The order of results to return
 * @returns All published posts
 */
export async function fetchPublishedPosts(offset: number, limit: number, order: PostOrder): Promise<any[]> {
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
 * Fetches all posts' info
 * @param withContent Whether to include post content
 * @param offset The offset to return results
 * @param limit The amount of results to return
 * @param order The order of results to return
 * @returns All posts' info
 */
export async function fetchPostInfos(withContent: boolean, offset: number, limit: number, order: PostOrder): Promise<PostInfo[]> {
    return processPostInfoRows(
        await postInfo(withContent)
            .offset(offset)
            .limit(limit)
            .orderByRaw(orderBy(order))
    )
}

/**
 * Fetches all published posts' info
 * @param withContent Whether to include post content
 * @param offset The offset to return results
 * @param limit The amount of results to return
 * @param order The order of results to return
 * @returns All published posts' info
 */
export async function fetchPublishedPostInfos(withContent: boolean, offset: number, limit: number, order: PostOrder): Promise<PostInfo[]> {
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
 * Fetches all published posts' info by the specific author
 * @param author The user ID of the author
 * @param withContent Whether to include post content
 * @param offset The offset to return results
 * @param limit The amount of results to return
 * @param order The order of results to return
 * @returns All published posts' info
 */
export async function fetchPublishedPostInfosByAuthor(author: string, withContent: boolean, offset: number, limit: number, order: PostOrder): Promise<PostInfo[]> {
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
 * Fetches a post by its slug (raw)
 * @param slug The post slug
 * @returns An array with the row containing the post or an empty array if none exists
 */
export async function fetchPostBySlug(slug: string): Promise<[ any? ]> {
    return await knex('posts')
        .select('*')
        .where('post_slug', slug) as [ any? ]
}

/**
 * Fetches a post's info by its ID
 * @param withContent Whether to include post content
 * @param id The post's ID
 * @returns An array with the row containing the post's info or an empty array if none exists
 */
export async function fetchPostInfoById(withContent: boolean, id: number): Promise<[ PostInfo? ]> {
    return processPostInfoRows(
        await postInfo(withContent)
            .where('posts.id', id)
    ) as [ PostInfo? ]
}

/**
 * Fetches a post's info by its slug
 * @param withContent Whether to include post content
 * @param slug The post slug
 * @returns An array with the row containing the post's info or an empty array if none exists
 */
export async function fetchPostInfoBySlug(withContent: boolean, slug: string): Promise<[ PostInfo? ]> {
    return processPostInfoRows(
        await postInfo(withContent)
            .where('post_slug', slug)
    ) as [ PostInfo? ]
}

/**
 * Fetches post infos by their IDs
 * @param withContent Whether to include post content
 * @param ids The IDs
 * @returns All post infos with the specified IDs
 */
export async function fetchPostInfosByIds(withContent: boolean, ids: number[]): Promise<PostInfo[]> {
    return processPostInfoRows(
        await postInfo(withContent)
            .whereIn('posts.id', ids)
    )
}

/**
 * Fetches all published posts' info with the specified tag
 * @param tag The tag to search for
 * @param withContent Whether to include post content
 * @param offset The offset to return results
 * @param limit The amount of results to return
 * @param order The order of results to return
 * @returns All published posts' info
 */
export async function fetchPublishedPostInfosByTag(tag: string, withContent: boolean, offset: number, limit: number, order: PostOrder): Promise<PostInfo[]> {
    return processPostInfoRows(
        await postInfo(withContent)
            .where('post_published', true)
            .andWhere(function(query) {
                query
                    .where('post_publish_date', '<', knex.raw('NOW()'))
                    .orWhere('post_publish_date', null)
            })
            .andWhereRaw('FIND_IN_SET(?, post_tags) > 0', [ tag ])
            .offset(offset)
            .limit(limit)
            .orderByRaw(orderBy(order))
    )
}

/**
 * Fetches all published posts' info with titles/contents/tags matching the specified SQL LIKE pattern
 * @param pattern The SQL LIKE pattern to match
 * @param withContent Whether to include post content
 * @param offset The offset to return results
 * @param limit The amount of results to return
 * @param order The order of results to return
 * @returns All published posts' info with title/contents/tags matching the specified SQL LIKE pattern
 */
export async function fetchPublishedPostInfosWherePostLike(pattern: string, withContent: boolean, offset: number, limit: number, order: PostOrder): Promise<PostInfo[]> {
    const patLower = pattern.toLowerCase()

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
                    .whereRaw('LOWER(post_title) LIKE ? ESCAPE \'|\'', [ patLower ])
                    .orWhereRaw('LOWER(post_content) LIKE ? ESCAPE \'|\'', [ patLower ])
                    .orWhereRaw('LOWER(post_tags) LIKE ? ESCAPE \'|\'', [ patLower ])
            })
            .offset(offset)
            .limit(limit)
            .orderByRaw(orderBy(order))
    )
}

/**
 * Returns the total amount of posts
 * @returns The total amount of posts
 */
export async function fetchPostsCount(): Promise<number> {
    return (
        await knex('posts')
            .count('*', { as: 'count' })
    )[0].count as number
}

/**
 * Fetches the amount of posts with a slug that matches the provided regular expression
 * @param slugRegex The regular expression
 * @returns The amount of posts that match the provided regular expression
 */
export async function fetchPostCountBySlugRegex(slugRegex: string): Promise<number> {
    return (await knex('posts')
        .count('*', { as: 'count' })
        .whereRaw('post_slug REGEXP ?', [ slugRegex ])
    )[0].count as number
}

/**
 * Fetches the amount of posts with the specified tag
 * @param tag The tag to search for
 * @returns The amount of posts with the specified tag
 */
export async function fetchPublishedPostCountByTag(tag: string): Promise<number> {
    return (await knex('posts')
        .count('*', { as: 'count' })
        .where('post_published', true)
        .andWhere(function(query) {
            query
                .where('post_publish_date', '<', knex.raw('NOW()'))
                .orWhere('post_publish_date', null)
        })
        .andWhereRaw('FIND_IN_SET(?, post_tags) > 0', [ tag ])
    )[0].count as number
}

/**
 * Fetches the amount of posts with titles/contents/tags like the specified pattern
 * @param pattern The pattern
 * @returns The amount of posts with title/contents/tags like the specified pattern
 */
export async function fetchPublishedPostCountWherePostLike(pattern: string): Promise<number> {
    const patLower = pattern.toLowerCase()

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
                .whereRaw('LOWER(post_title) LIKE ? ESCAPE \'|\'', [ patLower ])
                .orWhereRaw('LOWER(post_content) LIKE ? ESCAPE \'|\'', [ patLower ])
                .orWhereRaw('LOWER(post_tags) LIKE ? ESCAPE \'|\'', [ patLower ])
        }))[0].count as number
}

/**
 * Fetches the amount of posts with specified author
 * @param author The post author's ID
 * @returns The amount of posts with the specified author
 */
export async function fetchPublishedPostCountByAuthor(author: string): Promise<number> {
    return (await knex('posts')
            .count('*', { as: 'count' })
            .where('post_author', author)
            .andWhere('post_published', true)
            .andWhere(function(query) {
                query
                    .where('post_publish_date', '<', knex.raw('NOW()'))
                    .orWhere('post_publish_date', null)
            })
    )[0].count as number
}

/**
 * Returns rows containing only post tags in a column called "tags"
 * @returns Rows containing only post tags in a column called "tags"
 */
export async function fetchPostTags(): Promise<{ tags: string }[]> {
    return knex('posts')
        .select(knex.ref('post_tags').as('tags'))
}

/**
 * Updates the post with the specified ID
 * @param id The ID of the post to update
 * @param title The post's new title
 * @param slug The post's new slug
 * @param content The post's new content
 * @param tags The post's new tags
 * @param enableComments Whether the post will now have comments enabled
 * @param published Whether the post will now be published
 * @param publishDate The time when the post will be published, or null to be instantly published (still depends on "published" being true, regardless of this value)
 * @param showTitle Whether the post will now show its title
 * @param referencedMedia All media that the post now references (obsolete)
 */
export async function updatePostById(
    id: number,
    title: string,
    slug: string,
    content: string,
    tags: string[],
    enableComments: boolean,
    published: boolean,
    publishDate: Date | null,
    showTitle: boolean,
    referencedMedia: number[] = []
) {
    return knex('posts')
        .update({
            post_title: title,
            post_slug: slug,
            post_content: content,
            post_tags: arrayToSet(tags),
            post_enable_comments: enableComments,
            post_published: published,
            post_publish_date: publishDate,
            post_show_title: showTitle,
            post_referenced_media: arrayToSet(referencedMedia.map(id => id.toString()))
        })
        .where('id', id)
}

/**
 * Deletes the post with the specified ID
 * @param id The post ID
 */
export async function deletePostById(id: number) {
    return knex('posts')
        .del()
        .where('posts.id', id)
}

/**
 * Deletes the posts with the specified IDs
 * @param ids The post IDs
 */
export async function deletePostsByIds(ids: number[]) {
    return knex('posts')
        .del()
        .whereIn('posts.id', ids)
}