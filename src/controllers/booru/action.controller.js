const collectionsModel = require('../../models/collections.model')
const mediaModel = require('../../models/media.model')
const usersUtil = require('../../utils/users.util')

/**
 * @param {import('koa').Context} ctx
 * @param {Function} next
 * @returns {Promise<boolean>}
 */
async function handleUnauthorized(ctx, next) {
    // Deal with unauthenticated and unauthorized users
    if(!ctx.state.authed) {
        ctx.state.noRender = true
        ctx.redirect('/login?next='+encodeURIComponent(ctx.path))
        return false
    }

    // Check if user is an admin
    if(ctx.state.user.role < usersUtil.Roles.ADMIN) {
        ctx.state.noRender = true
        await next()
        return false
    }

    return true
}

/**
 * @param {import('koa').Context} ctx 
 */
function setupCtx(ctx) {
    // Page title
    ctx.state.pageTitle = 'Booru Action'

    // Error defaults to null, or whatever error is in query params
    ctx.state.error = ctx.query.error || null

    // Action defaults to null, or whatever action is in query params
    ctx.state.action = ctx.query.action || null

    // Sidebar requirements
    ctx.state.queryTags = []
}

/**
 * GET controller for booru action page
 * @param {import("koa").Context} ctx The context
 * @param {Function} next
 */
module.exports.getAction = async (ctx, next) => {
    if(!(await handleUnauthorized(ctx, next)))
        return

    // Setup context
    setupCtx(ctx)

    // Determine what to do based on action
    let action = ctx.state.action

    if(action === 'create-collection') {
        // No data to put into context
    } else if(action === 'add-to-collection') {
        let item = ctx.query.item*1 || -1
        let collection = ctx.query.collection*1 || -1

        // Put item and collection ID into context
        ctx.state.itemId = item
        ctx.state.collection = collection

        // Fetch collections without the specified item and put them into context
        ctx.state.collections = await collectionsModel.fetchCollectionInfosWithoutMedia(item, 0, Number.MAX_SAFE_INTEGER, 0)
    } else if(action === 'remove-from-collection') {
        let item = ctx.query.item*1 || -1
        let collection = ctx.query.collection*1 || -1

        // Put item and collection IDs into context
        ctx.state.itemId = item
        ctx.state.collection = collection
    } else if(action === 'delete-collection') {
        // Put collection ID into context
        ctx.state.collection = ctx.query.collection * 1 || -1
    }
}

/**
 * POST controller for booru action page
 * @param {import('koa').Context} ctx
 * @param {Function} next
 */
module.exports.postAction = async (ctx, next) => {
    if(!(await handleUnauthorized(ctx, next)))
        return

    // Setup context
    setupCtx(ctx)

    // Determine action
    let body = ctx.request.body
    let action = body.action
    
    if(action === 'create-collection') {
        // Collect data
        let title = body.title
        if(title)
            title = title.trim()
        let comment = body.comment
        if(comment)
            comment = comment.trim()

        // Create collection
        await collectionsModel.createCollection(title, comment ? comment : null, ctx.state.user.id)

        // Redirect to collections
        ctx.state.noRender = true
        ctx.redirect('/booru/collections')
    } else if(action === 'add-to-collection') {
        // Collect data
        let item = body.item*1
        let collection = body.collection*1

        // Validate
        if(!isNaN(item) && !isNaN(collection)) {
            // Check if item exists
            if((await mediaModel.fetchMediaInfoById(item)).length < 1) {
                ctx.state.error = 'Item does not exist'
                return
            }

            // Check if collection exists
            if((await collectionsModel.fetchCollectionInfoById(collection)).length < 1) {
                ctx.state.error = 'Collection does not exist'
                return
            }

            // Create collection item if it doesn't exist
            if(!(await collectionsModel.fetchMediaExistsInCollection(item, collection)))
                await collectionsModel.createCollectionItem(item, collection, ctx.state.user.id)
            
            // Redirect to collection
            ctx.state.noRender = true
            ctx.redirect('/booru/collection/'+collection)
        } else {
            ctx.state.error = 'Missing item or collection'
        }
    } else if(action === 'remove-from-collection') {
        // Collect data
        let item = body.item*1
        let collection = body.collection*1

        // Validate
        if(!isNaN(item) && !isNaN(collection)) {
            // Delete item entry
            await collectionsModel.deleteCollectionItemByMediaAndCollection(item, collection)
            
            // Redirect to collection
            ctx.state.noRender = true
            ctx.redirect('/booru/collection/'+collection)
        } else {
            ctx.state.error = 'Missing item or collection'
        }
    } else if(action === 'delete-collection') {
        // Collect data
        let collection = body.collection*1

        // Validate
        if(!isNaN(collection)) {
            // Delete collection
            await collectionsModel.deleteCollectionById(collection)
            
            // Redirect to list
            ctx.state.noRender = true
            ctx.redirect('/booru/collections')
        } else {
            ctx.state.error = 'Missing collection'
        }
    } else {
        ctx.state.error = 'Unknown or unspecified action'
    }
}