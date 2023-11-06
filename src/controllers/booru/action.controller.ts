import { Context, Next } from 'koa'
import { UserRoles } from 'utils/users.util'
import {
    createCollection, createCollectionItem, deleteCollectionById, deleteCollectionItemByMediaAndCollection,
    fetchCollectionInfoById,
    fetchCollectionInfosWithoutMedia,
    fetchMediaExistsInCollection
} from 'models/collections.model'
import { fetchMediaInfoById } from 'models/media.model'

async function handleUnauthorized(ctx: Context, next: Next): Promise<boolean> {
    // Deal with unauthenticated and unauthorized users
    if(!ctx.state.authed) {
        ctx.state.noRender = true
        ctx.redirect('/login?next='+encodeURIComponent(ctx.path))
        return false
    }

    // Check if user is an admin
    if(ctx.state.user.role < UserRoles.ADMIN) {
        ctx.state.noRender = true
        await next()
        return false
    }

    return true
}

// Puts boilerplate context data
function setupCtx(ctx: Context) {
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
 * @param ctx The context
 * @param next The next function
 */
export async function getAction(ctx: Context, next: Next) {
    if(!(await handleUnauthorized(ctx, next)))
        return

    // Setup context
    setupCtx(ctx)

    // Determine what to do based on action
    const action = ctx.state.action

    if(action === 'create-collection') {
        // No data to put into context
    } else if(action === 'add-to-collection') {
        const item = parseInt(ctx.query.item as string, 10) || -1
        const collection = parseInt(ctx.query.collection as string, 10) || -1

        // Put item and collection ID into context
        ctx.state.itemId = item
        ctx.state.collection = collection

        // Fetch collections without the specified item and put them into context
        ctx.state.collections = await fetchCollectionInfosWithoutMedia(item, 0, Number.MAX_SAFE_INTEGER, 0)
    } else if(action === 'remove-from-collection') {
        const item = parseInt(ctx.query.item as string, 10) || -1
        const collection = parseInt(ctx.query.collection as string, 10) || -1

        // Put item and collection IDs into context
        ctx.state.itemId = item
        ctx.state.collection = collection
    } else if(action === 'delete-collection') {
        // Put collection ID into context
        ctx.state.collection = parseInt(ctx.query.collection as string, 10) || -1
    }
}

/**
 * POST controller for booru action page
 * @param ctx The context
 * @param next The next function
 */
export async function postAction(ctx: Context, next: Next) {
    if(!(await handleUnauthorized(ctx, next)))
        return

    // Setup context
    setupCtx(ctx)

    // Determine action
    const body = ctx.request.body
    const action = body.action
    
    if(action === 'create-collection') {
        // Collect data
        const title = body.title?.trim()
        const comment = body.comment?.trim()

        // Create collection
        await createCollection(title, comment ? comment : null, parseInt(ctx.state.user.id, 10))

        // Redirect to collections
        ctx.state.noRender = true
        ctx.redirect('/booru/collections')
    } else if(action === 'add-to-collection') {
        // Collect data
        const item = parseInt(body.item, 10)
        const collection = parseInt(body.collection, 10)

        // Validate
        if(!isNaN(item) && !isNaN(collection)) {
            // Check if item exists
            if((await fetchMediaInfoById(item)).length < 1) {
                ctx.state.error = 'Item does not exist'
                return
            }

            // Check if collection exists
            if((await fetchCollectionInfoById(collection)).length < 1) {
                ctx.state.error = 'Collection does not exist'
                return
            }

            // Create collection item if it doesn't exist
            if(!(await fetchMediaExistsInCollection(item, collection)))
                await createCollectionItem(item, collection, ctx.state.user.id)
            
            // Redirect to collection
            ctx.state.noRender = true
            ctx.redirect('/booru/collection/'+collection)
        } else {
            ctx.state.error = 'Missing item or collection'
        }
    } else if(action === 'remove-from-collection') {
        // Collect data
        const item = parseInt(body.item, 10)
        const collection = parseInt(body.collection, 10)

        // Validate
        if(!isNaN(item) && !isNaN(collection)) {
            // Delete item entry
            await deleteCollectionItemByMediaAndCollection(item, collection)
            
            // Redirect to collection
            ctx.state.noRender = true
            ctx.redirect('/booru/collection/'+collection)
        } else {
            ctx.state.error = 'Missing item or collection'
        }
    } else if(action === 'delete-collection') {
        // Collect data
        const collection = parseInt(body.collection, 10)

        // Validate
        if(!isNaN(collection)) {
            // Delete collection
            await deleteCollectionById(collection)
            
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