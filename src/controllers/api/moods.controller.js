const moodsModel = require('../../models/moods.model')
const moodcharsModel = require('../../models/moodchars.model')
const moodUtils = require('../../utils/moods.util')
const fs = require('fs')
const util = require('util')
const unlink = util.promisify(fs.unlink)
const mediaUtils = require('../../utils/media.util')

async function deleteMood(moodInfoRow) {
    // Delete file on disk
    await unlink('media/moods/'+moodInfoRow.key)

    // Delete entry
    await moodsModel.deleteMoodById(moodInfoRow.id)
}

/**
 * GET controller for character listing
 * @param {import("koa").Context} ctx The context
 */
module.exports.getCharacters = async ctx => {
    // Fetch characters
    let characters = await moodUtils.getUsableCharacters()

    // Fetch total characters
    let total = characters.length

    // Send success
    ctx.apiSuccess({ characters, total })
}

/**
 * POST controller for setting default character moods
 * @param {import('koa').Context} ctx The context
 */
module.exports.postSetCharacterDefault = async ctx => {
    let body = ctx.request.body
    
    // Check for correct data
    if(!isNaN(body.character) && !isNaN(body.default)) {
        let charId = body.character*1
        let def = body.default

        // Fetch character
        let charRes = await moodcharsModel.fetchCharacterInfoById(charId)

        // Check if it exists
        if(charRes.length < 1) {
            ctx.apiError('invalid_character')
            return
        }
        
        let char = charRes[0]

        // Fetch mood
        let moodRes = await moodsModel.fetchMoodInfoById(def)

        // Check if it exists
        if(moodRes.length < 1) {
            ctx.apiError('invalid_mood')
            return
        }

        let mood = moodRes[0]

        // Make sure mood's character is the specified character
        if(mood.character != char.id) {
            ctx.apiError('mood_has_different_character')
            return
        }

        // Change default and clear caches
        await moodcharsModel.updateCharacterDefaultById(CharId, def)
        moodUtils.clearCaches()

        // Success
        ctx.apiSuccess()
    } else {
        ctx.apiError('missing_params')
    }
}

/**
 * POST controller for creating new characters
 * @param {import('koa').Context} ctx The context
 */
module.exports.postCreateCharacter = async ctx => {
    let body = ctx.request.body
    
    // Check for correct data
    if(body.name) {
        let name = body.name

        // Create character and clear caches
        await moodcharsModel.createCharacter(name, ctx.state.user.id)
        moodUtils.clearCaches()

        // Success
        ctx.apiSuccess()
    } else {
        ctx.apiError('missing_params')
    }
}

/**
 * POST controller for deleting characters
 * @param {import('koa').Context} ctx The context
 */
module.exports.postDeleteCharacter = async ctx => {
    let body = ctx.request.body
    
    // Check for correct data
    if(!isNaN(body.id)) {
        let id = body.id*1

        // Fetch character
        let charRes = await moodcharsModel.fetchCharacterInfoById(id)

        // Check if it exists
        if(charRes.length < 1) {
            ctx.apiError('invalid_character')
            return
        }

        let char = charRes[0]

        // Clear caches before operation
        moodUtils.clearCaches()

        // Fetch character's moods
        let moods = await moodsModel.fetchMoodInfosByCharacter(id, 0, Number.MAX_SAFE_INTEGER, moodsModel.Order.CREATED_ASC)

        // Delete every mood
        for(mood of moods)
            await deleteMood(mood)
        
        // Delete character
        await moodcharsModel.deleteCharacterById(id)

        // Clear caches after operation
        moodUtils.clearCaches()

        // Success
        ctx.apiSuccess()
    } else {
        ctx.apiError('missing_params')
    }
}

/**
 * GET controller for mood listing
 * @param {import("koa").Context} ctx The context
 */
module.exports.getMoods = async (ctx, next) => {
    // Collect data
    let body = ctx.request.body
    let charId = body.character*1

    // Fetch moods
    let moods = isNaN(charId) ? (await moodUtils.getMoods()) : (await moodUtils.getMoodsByCharacter(charId))

    // Fetch total moods
    let total = moods.length

    // Send success
    ctx.apiSuccess({ moods, total })
}

/**
 * POST controller for creating moods
 * @param {import('koa').Context} ctx The context
 */
module.exports.postCreateMood = async (ctx, next) => {
    let files = ctx.request.files
    let body = ctx.request.body

    // Check for correct data
    if(!body.name || isNaN(body.character)) {
        ctx.apiError('missing_params')
        return
    }

    // Collect data
    let name = body.name
    let charId = body.character*1

    // Fetch character
    let charRes = await moodcharsModel.fetchCharacterInfoById(charId)

    // Check if it exists
    if(charRes.length < 1) {
        ctx.apiError('invalid_character')
        return
    }

    let char = charRes[0]

    if('file' in files) {
        let file = files.file

        // Validate file
        if(file.size > 5_000_000) {
            // Delete file
            await unlink(file.path)

            // Error
            ctx.apiError('too_large', {
                max_size: config.site.maxUploadSize
            })
            return
        } else if(!file.type.startsWith('image/')) {
            ctx.apiError('invalid_type', {
                allowed: 'image/*'
            })
            return
        }

        // Generate key
        let key = generateAlphanumericString(10)+'.png'

        try {
            // Generate mood image
            await mediaUtils.generateMood(file.path, 'media/moods/'+key)

            // Delete original file
            await unlink(file.path)
        } catch(err) {
            ctx.apiError('process_failed')

            // Delete failed if file exists
            try { await unlink('media/moods/'+key) } catch(err) {}

            return
        }

        // Create mood entry
        await moodsModel.createMood(name, key, ctx.state.user.id)

        // Fetch newly created mood
        let mood = (await moodsModel.fetchMoodInfoByKey(key))[0]

        // Use newly created mood as character's default if no default is set
        if(char.default == null)
            await moodcharsModel.updateCharacterDefaultById(charId, mood.id)
        
        // Clear caches
        moodUtils.clearCaches()

        // Success
        ctx.apiSuccess({ id: mood.id })
    } else {
        ctx.apiError('no_file_provided')
    }
}

/**
 * POST controller for deleting moods
 * @param {import('koa').Context} ctx The context
 */
 module.exports.postDeleteMood = async (ctx, next) => {
    let body = ctx.request.body

    // Check for correct data
    if(isNaN(body.id)) {
        ctx.apiError('missing_params')
        return
    }

    // Collect data
    let id = body.id*1

    // Fetch mood
    let moodRes = await moodsModel.fetchMoodInfoById(id)

    // Check if it exists
    if(moodRes.length < 1) {
        ctx.apiError('invalid_mood')
        return
    }

    let mood = moodRes[0]

    // Fetch character
    let char = (await moodcharsModel.fetchCharacterInfoById(mood.character))

    // Delete mood
    await deleteMood(mood)

    // If character's default mood is the one that just got deleted, try to set it to another mood for that character, or set to null if no more are left
    if(char.default == id) {
        if(char.moods > 1) {
            // Fetch moods for character, and set default to the first one
            let moods = await moodsModel.fetchMoodInfosByCharacter(char.id)
            await moodcharsModel.updateCharacterDefaultById(char.id, moods[0].id)
        } else {
            // Nothing can be done, set default to null
            await moodcharsModel.updateCharacterDefaultById(char.id, null)
        }
    }

    // Success
    ctx.apiSuccess()
}