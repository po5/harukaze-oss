const commentsModel = require('../models/comments.model')
const postsModel = require('../models/posts.model')
const mediaModel = require('../models/media.model')
const { findMediaIdsInString } = require('../utils/misc.util')
const paginationUtil = require('../utils/pagination.util')
const { moodOrDefault } = require('../utils/reacts.util')
const { Roles } = require('../utils/users.util')

// Returns the post or 404s
async function fetchPostOr404(ctx, next) {
    // Fetch post
    let postRes = await postsModel.fetchPostInfoBySlug(true, ctx.params.slug)
    
    if(postRes.length > 0) {
        return postRes[0]
    } else {
        // Not found
        ctx.state.noRender = true
        await next()
        return null
    }
}
// Puts boilerplate context data
function setupCtx(ctx) {
    ctx.state.error = null
    ctx.state.replyErrors = {}
}

// Fetches and puts page data (post, comments, etc) into the state
async function fetchAndPutPageData(ctx, post) {
    // Check if comments are enabled
    let enableComments = post.enable_comments
    
    if(enableComments) {
        // Fetch total comments
        let totalComments = await commentsModel.fetchCommentsCountByPost(post.id)

        // Get pagination info
        let pagination = paginationUtil.paginatedRouteInfo(ctx, totalComments)

        // Fetch comments
        let comments = await commentsModel.fetchNormalCommentInfosByPost(post.id, pagination.queryOffset, pagination.queryLimit, commentsModel.Order.CREATED_DESC)

        // Fetch replies
        let commentIds = new Array(comments.length)
        for(i in comments)
            commentIds[i] = comments[i].id
        let replies = await commentsModel.fetchReplyCommentsByParentIds(commentIds)

        // Put context data
        ctx.state.comments = comments
        ctx.state.replies = replies
        ctx.state.pagination = pagination
    }

    // Extract media IDs
    let mediaIds = findMediaIdsInString(post.content)
    let media = []

    // Fetch media if there are any IDs, otherwise just give empty array to save a query
    if(mediaIds.length > 0) {
        media = await mediaModel.fetchBooruVisibleMediaInfosByIds(mediaIds)
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
 * @param {import("koa").Context} ctx The context
 */
module.exports.getBlog = async (ctx, next) => {
    let post = await fetchPostOr404(ctx, next)

    if(post) {
        setupCtx(ctx)

        await fetchAndPutPageData(ctx, post)
    }
}
module.exports.postBlog = async (ctx, next) => {
    let post = await fetchPostOr404(ctx, next)

    if(post) {
        setupCtx(ctx)

        // Check if user is logged in
        if(ctx.state.authed) {
            let body = ctx.request.body
            let action = body.action

            // Check action
            if(action == 'comment' && post.enable_comments) {
                // Collect data
                let content = body.content ? body.content.trim() : null
                let mood = moodOrDefault(body.mood)
                let reply = isNaN(body.reply) ? null : body.reply*1

                function showError(msg) {
                    if(reply == null)
                        ctx.state.error = msg
                    else
                        ctx.state.replyErrors[reply] = msg
                }

                if(content) {
                    // Check if parent exists if the comment is a reply to another
                    let parent = null
                    if(reply != null) {
                        let parentRes = await commentsModel.fetchNormalCommentById(reply)

                        if(parentRes.length > 0) {
                            parent = parentRes[0]
                        } else {
                            showError('You tried to reply to a comment that doesn\'t exist')
                            await fetchAndPutPageData(ctx, post)
                            return
                        }
                    }

                    // Create comment
                    await commentsModel.createComment(post.id, parent == null ? null : parent.id, ctx.state.user.id, content, mood)

                    // Redirect to first page if a normal comment, otherwise redirect to same page (to avoid reloading causing another POST)
                    ctx.state.noRender = true
                    ctx.redirect(reply == null ? '/blog/'+post.slug : ctx.path+'#comment-'+parent.id)
                } else {
                    showError('Comments can\'t just be blank!')
                    await fetchAndPutPageData(ctx, post)
                }
            } else if(action == 'delete') {
                let user = ctx.state.user

                // Check for comment
                if(!isNaN(body.comment)) {
                    let id = body.comment*1

                    // Fetch comment
                    let commentRes = await commentsModel.fetchCommentInfoById(id)

                    // Check if it exists
                    if(commentRes.length > 0) {
                        let comment = commentRes[0]

                        // Check for permission
                        if(user.id == comment.author || user.id == post.author || user.role >= Roles.ADMIN) {
                            // Delete comment
                            await commentsModel.deleteCommentById(id)

                            // Delete its children if a top-level comment
                            if(comment.parent == null)
                                await commentsModel.deleteCommentsByParent(id)
                        }
                    }
                }

                await fetchAndPutPageData(ctx, post)
            }
        } else {
            await fetchAndPutPageData(ctx, post)
        }
    }
}