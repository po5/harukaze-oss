import config from '../../config.json'

import fetch from './fetch.util'
import { HeadersInit } from 'node-fetch'
import { URLSearchParams } from 'node:url'

/**
 * A szurubooru resource version integer.
 *
 * To prevent problems with concurrent resource modification, szurubooru implements optimistic locks using resource versions. Each modifiable resource has its `version` returned to the client with `GET` requests. At the same time, each `PUT` and `DELETE` request sent by the client must present the same `version` field to the server with value as it was given in `GET`.
 *
 * For example, given `GET /post/1`, the server responds like this:
 *
 * ```json
 * {
 *     ...,
 *     "version": 2
 * }
 * ```
 *
 * This means the client must then send `{"version": 2}` back too. If the client fails to do so, the server will reject the request notifying about missing parameter. If someone has edited the post in the mean time, the server will reject the request as well, in which case the client is encouraged to notify the user about the situation.
 */
export type SzurubooruIntegrityVersion = number

/**
 * An ISO-8601 RFC 3339 datetime string.
 *
 * Example: `1970-01-01T00:00:00.000Z`
 */
export type SzurubooruDateTimeString = string

/**
 * A szurubooru color string.
 *
 * It will either be `default`, a hex color code, or a CSS color name.
 *
 * Technically, it must be a string the matches the following regex: `^(?:#[0-9A-Fa-f]+)|(?:[A-Za-z0-9]+)$`
 */
export type SzurubooruColorString = 'default' | `#${string}` | string

/**
 * Possible szurubooru user ranks
 */
export enum SzurubooruUserRank {
    /**
     * Restricted user
     */
    Restricted = 'restricted',

    /**
     * Regular user
     */
    Regular = 'regular',

    /**
     * Power user
     */
    Power = 'power',

    /**
     * Moderator
     */
    Moderator = 'moderator',

    /**
     * Administrator
     */
    Administrator = 'administrator',
}

/**
 * Possible szurubooru avatar styles
 */
export enum SzurubooruUserAvatarStyle {
    /**
     * The user uses Gravatar
     */
    Gravatar = 'gravatar',

    /**
     * The user has uploaded a picture manually
     */
    Manual = 'manual',
}

/**
 * Possible szurubooru safety ratings
 */
export enum SzurubooruSafetyRating {
    /**
     * Safe post.
     * Typically means that posts contain no nudity.
     */
    Safe = 'safe',

    /**
     * Sketchy post.
     * Typically means posts contain some nudity.
     */
    Sketchy = 'sketchy',

    /**
     * Unsafe post.
     * Typically means that posts contain full nudity.
     */
    Unsafe = 'unsafe',
}

/**
 * Possible szurubooru post types
 */
export enum SzurubooruPostType {
    /**
     * A plain image
     */
    Image = 'image',

    /**
     * An animated image (GIF)
     */
    Animation = 'animation',

    /**
     * A video (e.g. a WebM video)
     */
    Video = 'video',

    /**
     * A flash animation/game
     */
    Flash = 'flash',

    /**
     * A YouTube embed
     */
    Youtube = 'youtube',
}

/**
 * Possible szurubooru post flags
 */
export enum SzurubooruPostFlag {
    /**
     * Whether the video should loop
     */
    Loop = 'loop',

    /**
     * Whether the video's sound should be enabled by default
     */
    Sound = 'sound',
}

/**
 * Possible operations that can be performed on a szurubooru resource
 */
export enum SzurubooruResourceOperation {
    /**
     * The resource has been created
     */
    Created = 'created',

    /**
     * The resource has been modified
     */
    Modified = 'modified',

    /**
     * The resource has been deleted
     */
    Deleted = 'deleted',

    /**
     * The resource has been merged to another resource
     */
    Merged = 'merged',
}

/**
 * Possible szurubooru resource types
 */
export enum SzurubooruResourceType {
    /**
     * A tag.
     *
     * Its resource ID is its name (string).
     */
    Tag = 'tag',

    /**
     * A tag category.
     *
     * Its resource ID is its name (string).
     */
    TagCategory = 'tag_category',

    /**
     * A post.
     *
     * Its resource ID is its ID (number).
     */
    Post = 'post',

    /**
     * A pool.
     *
     * Its resource ID is its ID (number).
     */
    Pool = 'pool',
}

/**
 * Possible szurubooru error names
 */
export enum SzurubooruErrorName {
    MissingRequiredFileError = 'MissingRequiredFileError',

    MissingRequiredParameterError = 'MissingRequiredParameterError',

    /**
     * When trying to pass text when integer is expected etc.
     */
    InvalidParameterError = 'InvalidParameterError',

    /**
     * Race conditions when editing the same resource
     */
    IntegrityError = 'IntegrityError',

    SearchError = 'SearchError',

    AuthError = 'AuthError',

    PostNotFoundError = 'PostNotFoundError',

    PostAlreadyFeaturedError = 'PostAlreadyFeaturedError',

    PostAlreadyUploadedError = 'PostAlreadyUploadedError',

    InvalidPostIdError = 'InvalidPostIdError',

    InvalidPostSafetyError = 'InvalidPostSafetyError',

    InvalidPostSourceError = 'InvalidPostSourceError',

    InvalidPostContentError = 'InvalidPostContentError',

    InvalidPostRelationError = 'InvalidPostRelationError',

    InvalidPostNoteError = 'InvalidPostNoteError',

    InvalidPostFlagError = 'InvalidPostFlagError',

    InvalidFavoriteTargetError = 'InvalidFavoriteTargetError',

    InvalidCommentIdError = 'InvalidCommentIdError',

    CommentNotFoundError = 'CommentNotFoundError',

    EmptyCommentTextError = 'EmptyCommentTextError',

    InvalidScoreTargetError = 'InvalidScoreTargetError',

    InvalidScoreValueError = 'InvalidScoreValueError',

    TagCategoryNotFoundError = 'TagCategoryNotFoundError',

    TagCategoryAlreadyExistsError = 'TagCategoryAlreadyExistsError',

    TagCategoryIsInUseError = 'TagCategoryIsInUseError',

    InvalidTagCategoryNameError = 'InvalidTagCategoryNameError',

    InvalidTagCategoryColorError = 'InvalidTagCategoryColorError',

    TagNotFoundError = 'TagNotFoundError',

    TagAlreadyExistsError = 'TagAlreadyExistsError',

    TagIsInUseError = 'TagIsInUseError',

    InvalidTagNameError = 'InvalidTagNameError',

    InvalidTagRelationError = 'InvalidTagRelationError',

    InvalidTagCategoryError = 'InvalidTagCategoryError',

    InvalidTagDescriptionError = 'InvalidTagDescriptionError',

    UserNotFoundError = 'UserNotFoundError',

    UserAlreadyExistsError = 'UserAlreadyExistsError',

    InvalidUserNameError = 'InvalidUserNameError',

    InvalidEmailError = 'InvalidEmailError',

    InvalidPasswordError = 'InvalidPasswordError',

    InvalidRankError = 'InvalidRankError',

    InvalidAvatarError = 'InvalidAvatarError',

    /**
     * Failed to generate thumbnail or download remote file
     */
    ProcessingError = 'ProcessingError',

    /**
     * Catch all for odd validation errors
     */
    ValidationError = 'ValidationError',
}

/**
 * A szurubooru resource
 */
export interface SzurubooruResource {}

/**
 * A szurubooru resource with an integrity version field
 */
export interface SzurubooruVersionedResource extends SzurubooruResource {
    /**
     * The resource's integrity version
     */
    version: SzurubooruIntegrityVersion
}

/**
 * A szurubooru user, stripped down to `name` and `avatarUrl` fields
 */
export interface SzurubooruMicroUserResource extends SzurubooruResource {
    /**
     * The user's name (username)
     */
    name: string

    /**
     * The URL to the user's avatar.
     * If the avatar is not absolute, then it will be a URL relative to the base URL, without a preceding slash (e.g. "data/avatars/user.png").
     */
    avatarUrl: string
}

/**
 * A szurubooru user
 */
export interface SzurubooruUserResource extends SzurubooruMicroUserResource, SzurubooruVersionedResource {
    /**
     * The user's email address, or null if none
     */
    email: string | null

    /**
     * The user's rank
     */
    rank: SzurubooruUserRank

    /**
     * The user's last login time
     */
    lastLoginTime: SzurubooruDateTimeString

    /**
     * The user's creation time
     */
    creationTime: SzurubooruDateTimeString

    /**
     * The user's avatar style
     */
    avatarStyle: SzurubooruUserAvatarStyle

    /**
     * The number of comments the user has created
     */
    commentCount: number

    /**
     * The number of posts the user has uploaded
     */
    uploadedPostCount: number

    /**
     * The number of posts the user has liked
     */
    likedPostCount: number

    /**
     * The number of posts the user has disliked
     */
    dislikedPostCount: number

    /**
     * The number of posts the user has favorited
     */
    favoritePostCount: number
}

/**
 * A szurubooru user token
 */
export interface SzurubooruUserTokenResource extends SzurubooruVersionedResource {
    /**
     * The associated user
     */
    user: SzurubooruMicroUserResource

    /**
     * The token that can be used to authenticate the user
     */
    token: string

    /**
     * The note that describes the token, or null if none
     */
    note: string | null

    /**
     * Whether the token is enabled and still valid for authentication
     */
    enabled: boolean

    /**
     * The token's expiration time, or null if none
     */
    expirationTime: SzurubooruDateTimeString | null

    /**
     * The token's creation time
     */
    creationTime: SzurubooruDateTimeString

    /**
     * The token's last edit time.
     * If the token has never been edited, this time will match {@link creationTime}.
     */
    lastEditTime: SzurubooruDateTimeString

    /**
     * The token's last usage time.
     * If the token has never been used, this time will match {@link creationTime}.
     */
    lastUsageTime: SzurubooruDateTimeString
}

/**
 * A szurubooru tag, stripped down to `names`, `category` and `usages` fields.
 */
export interface SzurubooruMicroTagResource extends SzurubooruResource {
    /**
     * A list of tag names (aliases).
     * Tagging a post with any name will automatically assign the first name from this list.
     */
    names: string[]

    /**
     * The name of the category the given tag belongs to
     */
    category: string

    /**
     * The number of posts the tag was used in
     */
    usages: number
}

/**
 * A szurubooru tag
 */
export interface SzurubooruTagResource extends SzurubooruMicroTagResource, SzurubooruVersionedResource {
    /**
     * A list of implied tags.
     * Implied tags are automatically appended by the web client on usage.
     */
    implications: SzurubooruMicroTagResource[]

    /**
     * A list of suggested tags, serialized as micro tag resource. Suggested tags are shown to the user by the web client on usage
     */
    suggestions: SzurubooruMicroTagResource[]

    /**
     * The tag's creation time
     */
    creationTime: SzurubooruDateTimeString

    /**
     * The tag's last edit time.
     * If the tag has never been edited, this time will match {@link creationTime}.
     */
    lastEditTime: SzurubooruDateTimeString

    /**
     * The tag's description, or null if none
     */
    description: string | null
}

/**
 * A szurubooru post, stripped down to `id` and `thumbnailUrl` fields
 */
export interface SzurubooruMicroPostResource extends SzurubooruResource {
    /**
     * The post's sequential ID
     */
    id: number

    /**
     * A URI of where the post content is located.
     *
     * It will be relative to the base URL, and will not have a preceding slash.
     *
     * Example: `data/generated-thumbnails/10_83f7728c550e418c.jpg`
     */
    thumbnailUrl: string
}

/**
 * A szurubooru post
 */
export interface SzurubooruPostResource extends SzurubooruMicroPostResource, SzurubooruVersionedResource {
    /**
     * The post's creation time
     */
    creationTime: SzurubooruDateTimeString

    /**
     * The post's last edit time.
     * If the post has never been edited, this time will match {@link creationTime}.
     */
    lastEditTime: SzurubooruDateTimeString

    /**
     * The post's safety rating
     */
    safety: SzurubooruSafetyRating

    /**
     * The post's source (may be any string, not just a URL), or null if none
     */
    source: string | null

    /**
     * The post's type
     */
    type: SzurubooruPostType

    /**
     * The SHA1 file checksum.
     * Used in snapshots to signify changes of the post content.
     */
    checksum: string

    /**
     * The MD5 file checksum
     */
    checksumMD5: string

    /**
     * The file's size in bytes, or null if not applicable.
     *
     * Presumably not applicable for YouTube embeds.
     */
    fileSize: number | null

    /**
     * The original width of the post content
     */
    canvasWidth: number

    /**
     * The original height of the post content
     */
    canvasHeight: number

    /**
     * A URL or URI of where the post content is located.
     *
     * If a URI, it will be relative to the base URL, and will not have a preceding slash.
     *
     * Example: `data/posts/10_83f7728c550e418c.swf`
     */
    contentUrl: string

    /**
     * Various flags such as whether the post is looped, represented as array of plain strings
     */
    flags: SzurubooruPostFlag[]

    /**
     * List of tags the post is tagged with
     */
    tags: SzurubooruMicroTagResource[]

    /**
     * A list of related posts
     */
    relations: SzurubooruMicroPostResource[]

    /**
     * A list of post annotations
     */
    notes: SzurubooruNoteResource[]

    /**
     * Who created the post
     */
    user: SzurubooruMicroUserResource

    /**
     * The collective score (+1/-1 rating) of the given post.
     *
     * Will be an integer.
     */
    score: number

    /**
     * The score (+1/-1 rating) of the given post by the authenticated user.
     *
     * If the resource is not accessed by an authenticated user, this will be `0`.
     */
    ownScore: number | 0

    /**
     * Whether the authenticated user has given post in their favorites.
     *
     * If the resource is not accessed by an authenticated user, this will be `false`.
     */
    ownFavorite: boolean | false

    /**
     * How many tags the post is tagged with
     */
    tagCount: number

    /**
     * How many users have the post in their favorites
     */
    favoriteCount: number

    /**
     * How many comments are filed under that post
     */
    commentCount: number

    /**
     * How many notes the post has
     */
    noteCount: number

    /**
     * How many times has the post been featured
     */
    featureCount: number

    /**
     * How many posts are related to this post
     */
    relationCount: number

    /**
     * The last time the post was featured, or null if it was never featured
     */
    lastFeatureTime: SzurubooruDateTimeString | null

    /**
     * A list of users who have favorited the post
     */
    favoritedBy: SzurubooruMicroUserResource[]

    /**
     * Whether the post uses custom thumbnail
     */
    hasCustomThumbnail: boolean

    /**
     * A subsidiary to {@link type}, used to tell exact content format; useful for {@link SzurubooruPostType.Video} tags for instance
     */
    mimeType: string

    /**
     * A list of comments on the post
     */
    comments: SzurubooruCommentResource[]

    /**
     * A list of pools in which the post is a member
     */
    pools: SzurubooruMicroPoolResource[]
}

/**
 * A szurubooru note/annotation
 */
export interface SzurubooruNoteResource extends SzurubooruResource {
    /**
     * Where to draw the annotation.
     *
     * Each point must have floating point coordinates within `0` to `1`, where `0` represents 0% of the width/height of the content, and 1 represents 100% of the width/height of the content.
     *
     * For example, `[[0,0],[0,1],[1,1],[1,0]]` will draw the annotation on the whole post, whereas `[[0,0],[0,0.5],[0.5,0.5],[0.5,0]]` will draw it inside the post's upper left quarter.
     */
    polygon: [number, number][]

    /**
     * The annotation text.
     * The client should render is as Markdown.
     */
    text: string
}

/**
 * A szurubooru pool category
 */
export interface SzurubooruPoolCategoryResource extends SzurubooruVersionedResource {
    /**
     * The category name
     */
    name: string

    /**
     * The category's color
     */
    color: SzurubooruColorString

    /**
     * How many pools is the given category used with
     */
    usages: number

    /**
     * Whether the pool category is the default one
     */
    default: boolean
}

/**
 * A szurubooru pool, stripped down to `id`, `names`, `category`, `description` and `postCount` fields
 */
export interface SzurubooruMicroPoolResource extends SzurubooruResource {
    /**
     * The pool's sequential ID
     */
    id: number

    /**
     * A list of pool names (aliases)
     */
    names: string[]

    /**
     * The name of the category the given pool belongs to
     */
    category: string

    /**
     * The pool description (instructions how to use, history etc.), or null if none.
     * The client should render it as Markdown if not null.
     */
    description: string | null

    /**
     * The number of posts the pool has
     */
    postCount: number
}

/**
 * A szurubooru pool
 */
export interface SzurubooruPoolResource extends SzurubooruMicroPoolResource, SzurubooruVersionedResource {
    /**
     * An ordered list of posts in the pool.
     * Posts are ordered by insertion by default.
     */
    posts: SzurubooruMicroPostResource[]

    /**
     * The pool's creation time
     */
    creationTime: SzurubooruDateTimeString

    /**
     * The post's last edit time.
     * If the post has never been edited, this time will match {@link creationTime}.
     */
    lastEditTime: SzurubooruDateTimeString
}

/**
 * A szurubooru comment under a post
 */
export interface SzurubooruCommentResource extends SzurubooruVersionedResource {
    /**
     * The comment's sequential ID
     */
    id: number

    /**
     * The ID of the associated post
     */
    postId: number

    /**
     * The user who created the comment
     */
    user: SzurubooruMicroUserResource

    /**
     * The comment content.
     * The client should render is as Markdown.
     */
    text: string

    /**
     * The comment's creation time
     */
    creationTime: SzurubooruDateTimeString

    /**
     * The comment's last edit time.
     * If the comment has never been edited, this time will match {@link creationTime}.
     */
    lastEditTime: SzurubooruDateTimeString

    /**
     * The collective score (+1/-1 rating) of the given comment.
     *
     * Will be an integer.
     */
    score: number

    /**
     * The score (+1/-1 rating) of the given comment by the authenticated user.
     * If the resource is not accessed by an authenticated user, this will be `0`.
     */
    ownScore: number | 0
}

/**
 * A snapshot is a version of a szurubooru database resouce
 */
export interface SzurubooruSnapshotResource extends SzurubooruResource {
    /**
     * What happened to the resource
     */
    operation: SzurubooruResourceOperation

    /**
     * The type of resource that was changed.
     *
     * This value determines the type of the {@link id} field.
     */
    type: SzurubooruResourceType

    /**
     * The resource's ID.
     *
     * Depending on the value of {@link type}, this can be either an integer or a string.
     */
    id: number | string

    /**
     * The user who made the change
     */
    user: SzurubooruMicroUserResource

    /**
     * The snapshot data, whose content depends on the value of {@link operation}.
     *
     * TODO Use generics plus whatever else is required to fill this out
     */
    data: any

    /**
     * When the snapshot was created (i.e. when the resource was changed)
     */
    time: SzurubooruDateTimeString
}

/**
 * A szurubooru error response
 */
export interface SzurubooruError {
    /**
     * The computer-readable error name
     */
    name: SzurubooruErrorName

    /**
     * The human-readable error title (e.g. "Integrity violation")
     */
    title: string

    /**
     * The human-readable error description (e.g. "Someone else modified this in the meantime. Please try again.")
     */
    description: string
}

/**
 * A result of a search operation that doesn't involve paging
 */
export interface SzurubooruUnpageSearchResult<T> extends SzurubooruResource {
    /**
     * The search results
     */
    results: T[]
}

/**
 * A result of a search operation that involves paging
 */
export interface SzurubooruPagedSearchResult<T> extends SzurubooruUnpageSearchResult<T> {
    /**
     * The query passed in the original request that contains a standard search query, or an empty string if no query was passed
     */
    query: string | ''

    /**
     * The record starting offset, passed in the original request, or `0` if no offset was passed
     */
    offset: number | 0

    /**
     * The number of records to return per page, passed in the original request, or `100` if no limit was passed
     */
    limit: number | 100

    /**
     * How many resources were found.
     * To get the page count, divide this number by {@link limit}.
     */
    total: number
}

/**
 * A result of a reverse image search operation
 */
export interface SzurubooruImageSearchResult {
    /**
     * A post that is an exact byte-for-byte duplicate of the input file, or null if no exact duplicate was found
     */
    exactPost: SzurubooruPostResource | null

    /**
     * Posts that are not exact duplicates, but visually resemble the input file.
     * Works only on images and animations, i.e. does not work for videos and Flash movies.
     *
     * For non-images and corrupted images, this list is empty.
     */
    similarPosts: {
        /**
         * The distance from the original image expressed as a floating point number between 0 and 1, where 1 is not similar at all, and 0 is exactly the same
         */
        distance: number

        /**
         * The similar post
         */
        post: SzurubooruPostResource
    }[]
}

/**
 * A request to update a szurubooru resource
 */
export interface SzurubooruUpdateRequest {
    /**
     * The resource's current integrity version
     */
    version: SzurubooruIntegrityVersion
}

/**
 * Data that can be updated on a szurubooru user resource
 */
export interface SzurubooruUserUpdateData {
    /**
     * The user's new name
     */
    name?: string

    /**
     * The user's new password
     */
    password?: string

    /**
     * The user's new email
     */
    email?: string

    /**
     * The user's new rank
     */
    rank?: SzurubooruUserRank

    /**
     * The user's new avatar style
     */
    avatarStyle?: SzurubooruUserAvatarStyle

    /**
     * The URL to the user's new avatar (only required if {@link avatarStyle}'s value is {@link SzurubooruUserAvatarStyle.Manual})
     */
    avatarUrl?: string

    // TODO Avatar file upload
}

/**
 * A szurubooru update request for a user
 */
export interface SzurubooruUserUpdateRequest extends SzurubooruUserUpdateData, SzurubooruUpdateRequest {}

/**
 * A request to user creation request
 */
export interface SzurubooruUserCreateRequest {
    /**
     * The new user's name
     */
    name: string

    /**
     * The new user's password
     */
    password: string

    /**
     * The new user's email
     */
    email?: string

    /**
     * The user's new rank
     */
    rank?: SzurubooruUserRank

    /**
     * The user's new avatar style
     */
    avatarStyle?: SzurubooruUserAvatarStyle

    /**
     * The URL to the user's new avatar (only required if {@link avatarStyle}'s value is {@link SzurubooruUserAvatarStyle.Manual})
     */
    avatarUrl?: string

    // TODO Avatar file upload
}

/**
 * Interface for classes that provide credentials for authentication with szurubooru
 */
interface SzurubooruCredentials {
    /**
     * Returns a string to use for the HTTP `Authorization` header
     */
    getAuthorizationString(): string
}

/**
 * Represents an error returned by szurubooru
 */
export class SzurubooruClientError extends Error {
    /**
     * Instantiates a new `SzurubooruClientError` object
     * @param msg The error message
     * @param statusCode The HTTP status code returned by szurubooru
     * @param response The response returned by szurubooru
     */
    constructor(
        msg: string,
        public readonly statusCode: number,
        public readonly response: SzurubooruError,
    ) {
        super(msg)
    }

}

/**
 * Provides basic authentication credentials for szurubooru
 */
export class SzurubooruBasicCredentials implements SzurubooruCredentials {
    /**
     * The user's username
     */
    public readonly username: string

    /**
     * The user's password
     */
    public readonly password: string

    /**
     * Instantiates a new `SzurubooruBasicCredentials` object
     * @param username The user's username
     * @param password The user's password
     */
    constructor(username: string, password: string) {
        this.username = username
        this.password = password
    }

    getAuthorizationString(): string {
        return 'Basic ' + Buffer.from(this.username + ':' + this.password).toString('base64')
    }
}

export class SzurubooruTokenCredentials implements SzurubooruCredentials {
    public readonly username: string
    public readonly token: string

    /**
     * Instantiates a new `SzurubooruTokenCredentials` object
     * @param username The user's username
     * @param token The user's token
     */
    constructor(username: string, token: string) {
        this.username = username
        this.token = token
    }

    getAuthorizationString(): string {
        return 'Token ' + Buffer.from(this.username + ':' + this.token).toString('base64')
    }
}

/**
 * A client for interacting with a szurubooru instance
 */
export class SzurubooruClient {
    /**
     * The HTTP `Authorization` header value to use for requests
     * @private
     */
    private readonly authzStr: string | undefined

    /**
     * Instantiates a new szurubooru client
     * @param baseUrl The instance's base URL. Should not contain a trailing slash.
     * @param apiBaseUrl The instance's API base URL. Should not contain a trailing slash.
     * @param credentials The credentials to use for authenticating with the instance, or null to access anonymously
     */
    constructor(
        public readonly baseUrl: string,
        public readonly apiBaseUrl: string,
        public readonly credentials: SzurubooruCredentials | null
    ) {
        this.authzStr = credentials?.getAuthorizationString()
    }

    /**
     * Makes a raw instance request and returns the fetch {@link Response}
     * @param method The HTTP method
     * @param path The path to call, relative to the API base URL
     * @param params Any query parameters to send (optional, can be undefined)
     * @param body Any body data to send (optional, can be undefined, has no effect on `GET` requests)
     * @private
     */
    private async requestRaw(method: string, path: string, params?: Record<string, any>, body?: Record<string, any>): Promise<Response> {
        const headers: HeadersInit = {
            'Accept': 'application/json',
        }
        if (this.authzStr !== undefined) {
            headers['Authorization'] = this.authzStr
        }

        const ops: RequestInit = { method, headers }
        if (method !== 'GET' && body !== undefined) {
            headers['Content-Type'] = 'application/json'
            ops.body = JSON.stringify(body)
        }

        let url = this.apiBaseUrl + path
        if (params !== undefined) {
            url += '?' + new URLSearchParams(params as Record<string, string>).toString()
        }

        return fetch(url, ops)
    }

    /**
     * Checks a {@link Response} for an error status and throws accordingly
     * @param response The fetch response
     * @private
     */
    private async checkResponseForError(response: Response): Promise<void> | never {
        // Handle error responses
        if (response.status >= 400) {
            const errRes: SzurubooruError = await response.json()
            throw new SzurubooruClientError(errRes.description, response.status, errRes)
        }
    }

    /**
     * Performs a request on the instance
     * @param method The HTTP method
     * @param path The path to call, relative to the base URL
     * @param params Any query parameters to send (optional, can be undefined)
     * @param body Any body data to send (optional, can be undefined, has no effect on `GET` requests)
     * @returns {} The response data
     * @throws {SzurubooruClientError} If an error response was received
     */
    public async request<T>(method: string, path: string, params?: Record<string, any>, body?: Record<string, any>): Promise<T> | never {
        const response = await this.requestRaw(method, path, params, body)

        await this.checkResponseForError(response)

        return response.json()
    }

    /**
     * Performs a request on the instance, or returns null if the response has an HTTP 404 status
     * @param method The HTTP method
     * @param path The path to call, relative to the base URL
     * @param params Any query parameters to send (optional, can be undefined)
     * @param body Any body data to send (optional, can be undefined, has no effect on `GET` requests)
     * @returns {} The response data
     * @throws {SzurubooruClientError} If an error response was received
     */
    public async requestOrNullIf404<T>(method: string, path: string, params?: Record<string, any>, body?: Record<string, any>): Promise<T | null> | never {
        const response = await this.requestRaw(method, path, params, body)

        if (response.status === 404) {
            return null
        }

        await this.checkResponseForError(response)

        return response.json()
    }

    /**
     * Returns the user with the given username
     * @param username The user's username
     * @returns {} The user
     */
    public getUser(username: string): Promise<SzurubooruUserResource> | never {
        return this.request<SzurubooruUserResource>('GET', '/user/' + username)
    }

    /**
     * Returns the user with the given username, or null if none was found
     * @param username The user's username
     * @returns {} The user or null if none was found
     */
    public getUserOrNull(username: string): Promise<SzurubooruUserResource | null> | never {
        return this.requestOrNullIf404<SzurubooruUserResource>('GET', '/user/' + username)
    }

    /**
     * Updates a user
     * @param username The user's username
     * @param data The data to update
     * @param version The user's current integrity version (provide it if you have the latest, otherwise this method will fetch it)
     * @returns {} The updated user resource
     */
    public async updateUser(username: string, data: SzurubooruUserUpdateData, version?: SzurubooruIntegrityVersion): Promise<SzurubooruUserResource> | never {
        let ver: SzurubooruIntegrityVersion
        if (version === undefined) {
            ver = (await this.getUser(username)).version
        } else {
            ver = version
        }

        return this.request<SzurubooruUserResource>('PUT', '/user/' + username, undefined, { version: ver, ...data })
    }

    /**
     * Creates a new user
     * @param data The new user's data
     * @returns {} The newly created user resource
     */
    public async createUser(data: SzurubooruUserCreateRequest): Promise<SzurubooruUserResource> | never {
        return this.request<SzurubooruUserResource>('POST', '/users', undefined, data)
    }

    /**
     * Returns the post with the specified ID
     * @param id The post's ID
     * @returns {} The post
     */
    public async getPost(id: number): Promise<SzurubooruPostResource> | never {
        return this.request<SzurubooruPostResource>('GET', '/post/' + id)
    }

    /**
     * Returns the post with the specified ID, or null if none was found
     * @param id The post's ID
     * @returns {} The post or null if none was found
     */
    public async getPostOrNull(id: number): Promise<SzurubooruPostResource | null> | never {
        return this.requestOrNullIf404<SzurubooruPostResource>('GET', '/post/' + id)
    }

    /**
     * Creates a new user login token
     * @param username The user's username
     * @param enabled Whether the option is enabled (optional, defaults to true)
     * @param note The note to assign to the token (optional)
     * @param expirationTime The time the token should expire (optional)
     * @returns The newly created user token
     */
    public async createUserToken(username: string, enabled?: boolean, note?: string, expirationTime?: Date): Promise<SzurubooruUserTokenResource> {
        return this.request<SzurubooruUserTokenResource>('POST', '/user-token/' + username, undefined, {
            enabled,
            note,
            expirationTime: expirationTime?.toISOString(),
        })
    }

    /**
     * Creates a new user login token, and returns the cookie string to set to allow a browser to be logged in
     * @param username The user's username
     * @param enable Whether the option is enabled (optional, defaults to true)
     * @param note The note to assign to the token (optional)
     * @param expirationTime The time the token should expire (optional)
     * @returns The cookie string
     */
    public async createUserTokenCookieString(username: string, enable?: boolean, note?: string, expirationTime?: Date): Promise<string> {
        const { token } = await this.createUserToken(username, enable, note, expirationTime)

        return JSON.stringify({
            token,
            user: username,
        })
    }
}

let appSzurubooruClientImpl: SzurubooruClient | null
{
    // Construct app client instance if enabled
    const sz = config.szurubooru
    if (sz.enable) {
        let creds: SzurubooruCredentials | null
        if (sz.credentials.token) {
            creds = new SzurubooruTokenCredentials(sz.credentials.username, sz.credentials.token as unknown as string)
        } else {
            creds = new SzurubooruBasicCredentials(sz.credentials.username, sz.credentials.password as unknown as string)
        }

        appSzurubooruClientImpl = new SzurubooruClient(sz.baseUrl as unknown as string, sz.apiBaseUrl as unknown as string, creds)
    } else {
        appSzurubooruClientImpl = null
    }
}

/**
 * The application's szurubooru client.
 * If the application has not enabled szurubooru, it will be null.
 */
export const appSzurubooruClient = appSzurubooruClientImpl
