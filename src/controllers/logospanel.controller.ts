import { Context, Next } from 'koa'
import { copyFile, unlink } from 'fs/promises'
import { UserRoles } from 'utils/users.util'
import { deleteLogoByName, getLogoNames, getLogoPaths } from 'utils/logos.util'
import formidable from 'formidable'
import { generateAlphanumericString } from 'utils/misc.util'

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

async function setupCtx(ctx: Context) {
    // Page title
    ctx.state.pageTitle = 'Logos Panel'

    // Error defaults to null
    ctx.state.error = null

    // Logos
    ctx.state.logos = await getLogoNames()
}

/**
 * GET controller for logos panel page
 * @param ctx The context
 * @param next The next function
 */
export async function getLogosPanel(ctx: Context, next: Next) {
    if(!(await handleUnauthorized(ctx, next)))
        return

    // Setup context
    await setupCtx(ctx)
}

/**
 * POST controller for logos panel page
 * @param ctx The context
 * @param next The next function
 */
export async function postLogosPanel(ctx: Context, next: Next) {
    if(!(await handleUnauthorized(ctx, next)))
        return

    // Setup context
    await setupCtx(ctx)

    // Collect data
    const body = ctx.request.body
    const action = body.action
    
    // Handle actions
    if(action === 'delete') {
        const name = body.name

        // Check for name
        if(!name) {
            ctx.state.error = 'No name specified'
            return
        }

        // Get logos
        const logos = await getLogoPaths()

        // Check if logo can be deleted
        if(logos.length > 0) {
            // Delete logo
            await deleteLogoByName(name)

            // Reload logos
            ctx.state.logos = await getLogoNames()
        } else {
            ctx.state.error = 'Cannot delete logos when there are only 1'
        }
    } else if(action === 'upload') {
        // Check for file
        const files = ctx.request.files as unknown as formidable.Files

        if('file' in files) {
            const file = files.file as any

            if(file.type.startsWith('image/')) {
                const ogFname = file.name as string || 'image.'+file.type.substring('image/'.length)
                const ext = ogFname.substring(ogFname.lastIndexOf('.')+1)

                // Generate key
                const key = generateAlphanumericString(10)+'.'+ext

                // Copy file
                await copyFile(file.path, 'media/logos/'+key)

                // Delete original file
                await unlink(file.path)

                // Reload logos
                ctx.state.logos = await getLogoNames()
            } else {
                ctx.state.error = 'Can only upload images'
            }
        } else {
            ctx.state.error = 'No file provided'
        }
    }
}