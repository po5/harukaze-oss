const moodUtils = require('../utils/moods.util')
const usersUtil = require('../utils/users.util')
const usersModel = require('../models/users.model')
const { generateAlphanumericString } = require('../utils/misc.util')
const { generateAvatar } = require('../utils/media.util')
const fs = require('fs')
const util = require('util')
const unlink = util.promisify(fs.unlink)
const argon2 = require('argon2')

// Puts boilerplate context data
async function setupCtx(ctx) {
    const user = ctx.state.user
    ctx.state.pageTitle = 'My Account'
    ctx.state.error = null
    ctx.state.bio = user.bio
    ctx.state.info = user.info
    ctx.state.avatarUrl = ctx.state.user.role >= usersUtil.Roles.CONTRIBUTOR ? 
        '/assets/avatar/'+user.username
        :
        '/assets/mood/'+user.characterDefault
    ctx.state.characters = await moodUtils.getUsableCharacters()
    ctx.state.character = ctx.state.user.character
}

/**
 * GET controller for my account page
 * @param {import("koa").Context} ctx The context
 */
module.exports.getMyAccount = async (ctx, next) => {
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
 * @param {import("koa").Context} ctx The context
 */
module.exports.postMyAccount = async (ctx, next) => {
    // Deal with unauthenticated users
    if(!ctx.state.authed) {
        ctx.state.noRender = true
        ctx.redirect('/login?next='+encodeURIComponent(ctx.path))
        return
    }

    // Setup context
    await setupCtx(ctx)

    let user = ctx.state.user

    // Collect data
    let body = ctx.request.body
    let bio = (body.bio || '').trim()
    let info = (body.info || '').trim()
    let char = await moodUtils.getCharacterById(body.character*1)

    // Make sure character is valid
    if(!char) {
        ctx.state.error = 'Invalid character ID'
        return
    }
    
    // Validate
    ctx.state.bio = bio
    ctx.state.info = info
    ctx.state.character = char.id
    if(bio.length > 2048) {
        ctx.state.error = 'Bio is too long (max length is 2048 characters)'
        return
    }

    // Update user
    await usersModel.updateUserInfoById(user.id, bio, char.id, info)

    // Check if avatar was set, and the user is a contributor or higher
    if(user.role >= usersUtil.Roles.CONTRIBUTOR) {
        let files = ctx.request.files

        if('avatar' in files && files.avatar.size > 0) {
            let file = files.avatar

            // Validate file
            if(file.size > 5_000_000) {
                ctx.state.error = 'Avatars cannot be more than 5MB in size'
                return
            } else if(!file.type.startsWith('image/')) {
                ctx.state.error = 'You can only upload images'
                return
            }

            // Generate key
            let key = `${user.username}-${generateAlphanumericString(5)}.${file.name.endsWith('.gif') ? 'webp' : 'png'}`

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
                try { await unlink('media/avatars/'+key) } catch(err) {}

                return
            }

            try {
                // Update avatar key in user entry
                await usersModel.updateUserAvatarKeyById(user.id, key)

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
    ctx.state.avatarUrl = user.role >= usersUtil.Roles.CONTRIBUTOR ? 
        '/assets/avatar/'+user.username
        :
        '/assets/mood/'+ctx.state.character

    // Update password if specified
    if (body['current-password']) {
        /** @type {string} */
        const currentPass = body['current-password']

        // Fetch user
        const user = (await usersModel.fetchUserById(ctx.state.user.id))[0]

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
            if (!usersUtil.isUsernameValid(newUsername)) {
                ctx.state.error = 'The new username you chose is invalid'
                return
            }

            // Check if the username is taken
            if (newUsername.toLowerCase() === ctx.state.user.username.toLowerCase()) {
                ctx.state.error = `Your username is already "${newUsername}"`
                return
            } else if ((await usersModel.fetchUserByUsername(newUsername)).length > 0) {
                ctx.state.error = 'A user with that username already exists'
                return
            }

            // All is well; apply the new username
            await usersModel.updateUserUsernameById(ctx.state.user.id, newUsername)
            ctx.state.user.username = newUsername

            // Re-setup context with new username and tell the page to reload
            await setupCtx(ctx)
            ctx.state.reload = true
        }

        // Change password
        if (body['new-password'] && body['repeat-password']) {
            /** @type {string} */
            const newPass = body['new-password']
            /** @type {string} */
            const repeatPass = body['repeat-password']

            if(newPass !== repeatPass) {
                ctx.state.error = 'New passwords do not match'
                return
            }

            // Update password
            await usersUtil.changeUserPassword(user.id, newPass)
        }
    }
}
