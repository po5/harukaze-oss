import config from '../../config.json'
import { Context, Next } from 'koa'
import { fetchPostInfoBySlug, PostInfo } from 'models/posts.model'
import {
    CommentInfo,
    CommentOrder,
    CommentType, createComment, deleteCommentById, deleteCommentsByParent, fetchCommentInfoById, fetchNormalCommentById,
    fetchNormalCommentInfosByPost,
    fetchNormalCommentsCountByPost, fetchReplyCommentsByParentIds
} from 'models/comments.model'
import { paginatedRouteInfo } from 'utils/pagination.util'
import { findMediaIdsInString } from 'utils/misc.util'
import { fetchBooruVisibleMediaInfosByIds, MediaInfo } from 'models/media.model'
import { getMoodById } from 'utils/moods.util'
import { UserRoles } from 'utils/users.util'
import { deletePostsAndDependentsByIds } from 'utils/posts.util'

// Returns the post or 404s
async function fetchPostOr404(ctx: Context, next: Next): Promise<PostInfo | null> {
    // Fetch post
    const [ post ] = await fetchPostInfoBySlug(true, ctx.params.slug)
    
    if(post) {
        return post
    } else {
        // Not found
        ctx.state.noRender = true
        await next()
        return null
    }
}
// Puts boilerplate context data
function setupCtx(ctx: Context) {
    ctx.state.error = null
    ctx.state.deleteError = null
    ctx.state.replyErrors = {}
}

// Fetches and puts page data (post, comments, etc) into the state
async function fetchAndPutPageData(ctx: Context, post: PostInfo) {
    // Check if comments are enabled
    const enableComments = post.enable_comments
    
    if(enableComments) {
        // Fetch total comments
        const totalComments = await fetchNormalCommentsCountByPost(post.id, CommentType.POST)

        // Get pagination info
        const pagination = paginatedRouteInfo(ctx, totalComments)

        // Fetch comments
        const comments = await fetchNormalCommentInfosByPost(post.id, CommentType.POST, pagination.queryOffset, pagination.queryLimit, CommentOrder.CREATED_DESC)

        // Fetch replies
        const commentIds = new Array(comments.length)
        for(let i = 0; i < comments.length; i++)
            commentIds[i] = comments[i].id
        const replies = await fetchReplyCommentsByParentIds(commentIds)

        // Put context data
        ctx.state.comments = comments
        ctx.state.replies = replies
        ctx.state.pagination = pagination
    }

    let media: MediaInfo[] = []

    // If the booru is enabled, try to find booru items in the post content
    if(config.site.enableBooru) {
        // Extract media IDs
        const mediaIds = findMediaIdsInString(post.content as string)

        // Fetch media if there are any IDs, otherwise just give empty array to save a query
        if(mediaIds.length > 0)
            media = await fetchBooruVisibleMediaInfosByIds(mediaIds)
    }

    ctx.state.media = media

    // Page title
    ctx.state.pageTitle = post.title

    // Put context data
    ctx.state.post = post
    ctx.state.enableComments = enableComments
}

/**
 * GET controller for blog page
 * @param ctx The context
 * @param next The next function
 */
export async function getBlog(ctx: Context, next: Next) {
    let post = await fetchPostOr404(ctx, next)

    if(post) {
        setupCtx(ctx)

        await fetchAndPutPageData(ctx, post)
    }
}
export async function postBlog(ctx: Context, next: Next) {
    const post = await fetchPostOr404(ctx, next)

    if(post) {
        setupCtx(ctx)

        // Check if user is logged in
        if(ctx.state.authed) {
            const body = ctx.request.body
            const action = body.action

            // Check action
            if(action === 'create-comment' && post.enable_comments) {
                // Collect data
                const content = body.content?.trim() || null
                const mood = await getMoodById(parseInt(body.mood, 10))
                const reply = isNaN(body.reply) ? null : body.reply*1

                function showError(msg: string) {
                    if(reply === null)
                        ctx.state.error = msg
                    else
                        ctx.state.replyErrors[reply] = msg
                }

                // Make sure mood is valid
                if(!mood) {
                    showError(`The mood ID "${body.mood}" does not exist`)
                    await fetchAndPutPageData(ctx, post)
                    return
                }

                // Make sure content is not blank or null
                if(content) {
                    // Check if parent exists if the comment is a reply to another
                    let parent: CommentInfo | null = null
                    if(reply != null) {
                        const parentRes = await fetchNormalCommentById(reply)

                        if(parentRes.length > 0) {
                            parent = parentRes[0]
                        } else {
                            showError('You tried to reply to a comment that doesn\'t exist')
                            await fetchAndPutPageData(ctx, post)
                            return
                        }
                    }

                    // Create comment
                    await createComment(post.id, (parent || {}).id || null, ctx.state.user.id, content, mood.id, CommentType.POST)

                    // Redirect to first page if a normal comment, otherwise redirect to same page (to avoid reloading causing another POST)
                    ctx.state.noRender = true
                    ctx.redirect(reply == null ? '/blog/'+post.slug : ctx.path+'#comment-'+parent?.id)
                } else {
                    showError('Comments can\'t just be blank!')
                    await fetchAndPutPageData(ctx, post)
                }
            } else if(action === 'delete-comment') {
                const user = ctx.state.user

                // Check for comment
                if(!isNaN(body.comment)) {
                    const id = parseInt(body.comment, 10)

                    // Fetch comment
                    const [ comment ] = await fetchCommentInfoById(id)

                    // Check if it exists
                    if(comment) {
                        // Check for permission
                        if(user.id === comment.author || user.id === post.author || user.role >= UserRoles.ADMIN) {
                            // Delete comment
                            await deleteCommentById(id)

                            // Delete its children if a top-level comment
                            if(comment.parent == null)
                                await deleteCommentsByParent(id)
                        }
                    }
                }

                await fetchAndPutPageData(ctx, post)
            } else if(action === "delete-post") {
                const user = ctx.state.user

                // Check for permission
                if(user.id !== post.author && user.role < UserRoles.ADMIN) {
                    await fetchAndPutPageData(ctx, post)
                    return
                }

                // Check input against post title
                const inputTitle = body.title?.trim() || null
                if(inputTitle !== post.title) {
                    ctx.state.deleteError = 'Titles did not match. Input is case-sensitive!'
                    await fetchAndPutPageData(ctx, post)
                    return
                }

                // Delete post
                await deletePostsAndDependentsByIds([ post.id ])

                // Redirect to homepage
                ctx.state.noRender = true
                await ctx.redirect('/')
            } else {
                // No action (or invalid action) specified, render page normally
                await fetchAndPutPageData(ctx, post)
            }
        } else {
            await fetchAndPutPageData(ctx, post)
        }
    }
}