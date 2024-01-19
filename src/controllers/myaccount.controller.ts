import { Context, Next } from 'koa'
import argon2 from 'argon2'
import { changeUserPassword, isUsernameValid, updateUserUsername, UserRoles } from 'utils/users.util'
import { getCharacterById, getUsableCharacters } from 'utils/moods.util'
import {
    fetchUserById,
    fetchUserByUsername,
    updateUserAvatarKeyById,
    updateUserInfoById,
    updateUserUsernameById, userInfoToUserBasicInfo, userRowToBasicInfo
} from 'models/users.model'
import formidable from 'formidable'
import { generateAlphanumericString } from 'utils/misc.util'
import { generateAvatar } from 'utils/media.util'
import { unlink } from 'fs/promises'
import { MAX_USER_AVATAR_SIZE, MAX_USER_BIO_LENGTH } from 'root/constants'

// Puts boilerplate context data
async function setupCtx(ctx: Context) {
    const user = ctx.state.user
    ctx.state.pageTitle = 'My Account'
    ctx.state.error = null
    ctx.state.bio = user.bio
    ctx.state.maxBioLength = MAX_USER_BIO_LENGTH
    ctx.state.info = user.info
    ctx.state.maxAvatarSize = MAX_USER_AVATAR_SIZE
    ctx.state.avatarUrl = ctx.state.user.role >= UserRoles.CONTRIBUTOR ?
        '/assets/avatar/'+user.username
        :
        '/assets/mood/'+user.characterDefault
    ctx.state.characters = await getUsableCharacters()
    ctx.state.character = ctx.state.user.character
}

/**
 * GET controller for my account page
 * @param ctx The context
 * @param next The next function
 */
export async function getMyAccount(ctx: Context, next: Next) {
    // Deal with unauthenticated users
    if(!ctx.state.authed) {
        ctx.state.noRender = true
        ctx.redirect('/login?next='+encodeURIComponent(ctx.path))
        return
    }

    // Setup context
    await setupCtx(ctx)
}

/**
 * POST controller for my account page
 * @param ctx The context
 * @param next The next function
 */
export async function postMyAccount(ctx: Context, next: Next) {
    // Deal with unauthenticated users
    if(!ctx.state.authed) {
        ctx.state.noRender = true
        ctx.redirect('/login?next='+encodeURIComponent(ctx.path))
        return
    }

    // Setup context
    await setupCtx(ctx)

    const user = ctx.state.user

    // Collect data
    const body = ctx.request.body
    const bio = (body.bio || '').trim()
    const info = (body.info || '').trim()
    const char = await getCharacterById(body.character*1)

    // Make sure character is valid
    if(!char) {
        ctx.state.error = 'Invalid character ID'
        return
    }
    
    // Validate
    ctx.state.bio = bio
    ctx.state.info = info
    ctx.state.character = char.id
    if(bio.length > MAX_USER_BIO_LENGTH) {
        ctx.state.error = `Bio is too long (max length is ${MAX_USER_BIO_LENGTH} characters)`
        return
    }

    // Update user
    await updateUserInfoById(user.id, bio, char.id, info)

    // Check if avatar was set, and the user is a contributor or higher
    if(user.role >= UserRoles.CONTRIBUTOR) {
        const files = ctx.request.files as unknown as formidable.Files

        const file = files.avatar as any
        if(file && file.size > 0) {
            // Validate file
            if(file.size > MAX_USER_AVATAR_SIZE) {
                ctx.state.error = `Avatars cannot be more than ${(MAX_USER_AVATAR_SIZE/1024/1024).toFixed(2)}MB in size`
                return
            } else if(!file.type.startsWith('image/')) {
                ctx.state.error = 'You can only upload images'
                return
            }

            // Generate key
            const key = `${user.username}-${generateAlphanumericString(5)}.${file.name.endsWith('.gif') ? 'webp' : 'png'}`

            try {
                // Generate avatar
                await generateAvatar(file.path, 'media/avatars/'+key)

                // Delete original file
                await unlink(file.path)
            } catch(err) {
                console.error(`Failed to process avatar file ${file.name}:`)
                console.error(err)
                ctx.state.error = 'Failed to process avatar file'

                // Delete failed if file exists
                try {
                    await unlink('media/avatars/'+key)
                } catch(err) {}

                return
            }

            try {
                // Update avatar key in user entry
                await updateUserAvatarKeyById(user.id, key)

                // Delete existing avatar file, if any
                if(user.avatarKey)
                    await unlink('media/avatars/'+user.avatarKey)

                // Put key into context
                user.avatarKey = key
            } catch(err) {
                console.error(`Failed to update user entry or delete original avatar file ${user.avatar_key}:`)
                console.error(err)
                ctx.state.error = 'Internal error occurred'
                return
            }
        }
    }

    // Update avatar URL
    ctx.state.avatarUrl = user.role >= UserRoles.CONTRIBUTOR ?
        '/assets/avatar/'+user.username
        :
        '/assets/mood/'+ctx.state.character

    // Update password if specified
    if(body['current-password']) {
        const currentPass = body['current-password'] as string

        // Fetch user
        const user = (await fetchUserById(ctx.state.user.id))[0]!

        // Check hash
        if(!(await argon2.verify(user.user_hash, currentPass))) {
            ctx.state.error = 'Current password is incorrect'
            return
        }

        // Change username
        if (body['new-username']) {
            /** @type {string} */
            const newUsername = body['new-username']

            // Validate username
            if (!isUsernameValid(newUsername)) {
                ctx.state.error = 'The new username you chose is invalid'
                return
            }

            // Check if the username is taken
            if (newUsername.toLowerCase() === ctx.state.user.username.toLowerCase()) {
                ctx.state.error = `Your username is already "${newUsername}"`
                return
            } else if ((await fetchUserByUsername(newUsername)).length > 0) {
                ctx.state.error = 'A user with that username already exists'
                return
            }

            // All is well; apply the new username
            await updateUserUsername(userInfoToUserBasicInfo(ctx.state.user), newUsername)
            ctx.state.user.username = newUsername

            // Re-setup context with new username and tell the page to reload
            await setupCtx(ctx)
            ctx.state.reload = true
        }


        if (body['new-password'] && body['repeat-password']) {
            const newPass = body['new-password'] as string
            const repeatPass = body['repeat-password'] as string

            if (newPass !== repeatPass) {
                ctx.state.error = 'New passwords do not match'
                return
            }

            // Update password
            await changeUserPassword(userRowToBasicInfo(user), newPass)
        }
    }
}
