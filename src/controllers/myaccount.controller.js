const config = require('../../config.json')
const moodUtils = require('../utils/moods.util')
const usersUtil = require('../utils/users.util')
const usersModel = require('../models/users.model')
const { generateAlphanumericString } = require('../utils/misc.util')
const { generateAvatar } = require('../utils/media.util')
const fs = require('fs')
const util = require('util')
const unlink = util.promisify(fs.unlink)

// Puts boilerplate context data
async function setupCtx(ctx) {
    let user = ctx.state.user
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
    let bio = body.bio?.trim()
    let info = body.info?.trim()
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

    // Check if avatar was sent, and the user is a contributor or higher
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
}