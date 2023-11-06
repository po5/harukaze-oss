import config from '../../../config.json'
import { unlink } from 'fs/promises'
import {
    createMood,
    deleteMoodById,
    fetchMoodInfoById,
    fetchMoodInfoByKey,
    fetchMoodInfosByCharacter,
    MoodInfo,
    MoodOrder
} from 'models/moods.model'
import { Context, Next } from 'koa'
import {
    createCharacter,
    deleteCharacterById,
    fetchCharacterInfoById,
    fetchCharacterInfos,
    fetchCharactersCount,
    MoodCharOrder,
    updateCharacterDefaultById
} from 'models/moodchars.model'
import {
    clearCaches as clearMoodCaches,
    getMoods as getMoodInfos,
    getMoodsByCharacter,
    getUsableCharacters
} from 'utils/moods.util'
import { updateUserCharacterByCharacter } from 'models/users.model'
import { generateAlphanumericString } from 'utils/misc.util'
import { generateMood } from 'utils/media.util'

async function deleteMood(moodInfoRow: MoodInfo) {
    // Delete file on disk
    await unlink('media/moods/'+moodInfoRow.key)

    // Delete entry
    await deleteMoodById(moodInfoRow.id)
}

/**
 * GET controller for character listing
 * @param ctx The context
 * @param _next The next function
 */
export async function getCharacters(ctx: Context, _next: Next) {
    // Fetch characters
    const characters = await fetchCharacterInfos(0, Number.MAX_SAFE_INTEGER, MoodCharOrder.CREATED_ASC)

    // Fetch total characters
    const total = characters.length

    // Send success
    ctx.apiSuccess({ characters, total })
}

/**
 * POST controller for setting default character moods
 * @param ctx The context
 * @param _next The next function
 */
export async function postSetCharacterDefault(ctx: Context, _next: Next) {
    const body = ctx.request.body
    
    // Check for correct data
    if(isNaN(body.character) || isNaN(body.default)) {
        ctx.apiError('missing_params')
        return
    }

    const charId = parseInt(body.character, 10)
    const def = body.default

    // Fetch character
    const [ char ] = await fetchCharacterInfoById(charId)

    // Check if it exists
    if(!char) {
        ctx.apiError('invalid_character')
        return
    }

    // Fetch mood
    const [ mood ] = await fetchMoodInfoById(def)

    // Check if it exists
    if(!mood) {
        ctx.apiError('invalid_mood')
        return
    }

    // Make sure mood's character is the specified character
    if(mood.character !== char.id) {
        ctx.apiError('mood_has_different_character')
        return
    }

    // Change default and clear caches
    await updateCharacterDefaultById(charId, def)
    clearMoodCaches()

    // Success
    ctx.apiSuccess()
}

/**
 * POST controller for creating new characters
 * @param ctx The context
 * @param _next The next function
 */
export async function postCreateCharacter(ctx: Context, _next: Next) {
    const body = ctx.request.body
    
    // Check for correct data
    if(!body.name) {
        ctx.apiError('missing_params')
        return
    }

    const name = body.name as string

    // Create character and clear caches
    await createCharacter(name, ctx.state.user.id)
    clearMoodCaches()

    // Success
    ctx.apiSuccess()
}

/**
 * POST controller for deleting characters
 * @param ctx The context
 * @param _next The next function
 */
export async function postDeleteCharacter(ctx: Context, _next: Next) {
    const body = ctx.request.body
    
    // Check for correct data
    const id = parseInt(body.id, 10)
    if(isNaN(id)) {
        ctx.apiError('missing_params')
        return
    }

    // Fetch total characters
    const total = await fetchCharactersCount()

    // Don't allow deletion if this is the only character
    if(total < 2) {
        ctx.apiError('cannot_delete_only_character')
        return
    }

    // Fetch character
    const [ char ] = await fetchCharacterInfoById(id)

    // Check if it exists
    if(!char) {
        ctx.apiError('invalid_character')
        return
    }

    // Clear caches before operation
    clearMoodCaches()

    // Fetch character's moods
    const moods = await fetchMoodInfosByCharacter(id, 0, Number.MAX_SAFE_INTEGER, MoodOrder.CREATED_ASC)

    // Delete every mood
    for(const mood of moods)
        await deleteMood(mood)

    // Delete character
    await deleteCharacterById(id)

    // Clear caches after operation
    clearMoodCaches()

    // Fetch first character and update all user characters to it if they're using the deleted character
    const [ newChar ] = (await getUsableCharacters())
    await updateUserCharacterByCharacter(id, newChar.id)

    // Success
    ctx.apiSuccess()
}

/**
 * GET controller for mood listing
 * @param ctx The context
 * @param next The next function
 */
export async function getMoods(ctx: Context, next: Next) {
    // Collect data
    const body = ctx.request.body
    const charId = parseInt(body.character, 10)

    // Fetch moods
    const moods = isNaN(charId) ? (await getMoodInfos()) : (await getMoodsByCharacter(charId))

    // Fetch total moods
    const total = moods.length

    // Send success
    ctx.apiSuccess({ moods, total })
}

/**
 * POST controller for creating moods
 * @param ctx The context
 * @param next The next function
 */
export async function postCreateMood(ctx: Context, next: Next) {
    const files = ctx.request.files as any
    const body = ctx.request.body

    // Check for correct data
    if(!body.name || isNaN(body.character)) {
        ctx.apiError('missing_params')
        return
    }

    // Collect data
    const name = body.name
    const charId = parseInt(body.character, 10)

    // Fetch character
    const [ char ] = await fetchCharacterInfoById(charId)

    // Check if it exists
    if(!char) {
        ctx.apiError('invalid_character')
        return
    }

    if('file' in files) {
        const file = files.file

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
        const key = generateAlphanumericString(10)+'.png'

        try {
            // Generate mood image
            await generateMood(file.path, 'media/moods/'+key)

            // Delete original file
            await unlink(file.path)
        } catch(err) {
            ctx.apiError('process_failed')

            // Delete failed if file exists
            try {
                await unlink('media/moods/'+key)
            } catch(err) {}

            return
        }

        // Create mood entry
        await createMood(name, key, charId, ctx.state.user.id)

        // Fetch newly created mood
        const [ mood ] = await fetchMoodInfoByKey(key)

        // Make sure the newly created mood was actaully fetched
        if(!mood) {
            console.error(`Failed to fetch newly created mood with key ${key}. This shouldn't happen, did the mood really get created?`)
            ctx.apiError('internal_error')
            return
        }

        // Use newly created mood as character's default if no default is set
        if(char.default == null)
            await updateCharacterDefaultById(charId, mood.id)
        
        // Clear caches
        clearMoodCaches()

        // Success
        ctx.apiSuccess({ id: mood.id })
    } else {
        ctx.apiError('no_file_provided')
    }
}

/**
 * POST controller for deleting moods
 * @param ctx The context
 * @param next The next function
 */
export async function postDeleteMood(ctx: Context, next: Next) {
    let body = ctx.request.body

    // Check for correct data
    if(isNaN(body.id)) {
        ctx.apiError('missing_params')
        return
    }

    // Collect data
    const id = parseInt(body.id, 10)

    // Fetch mood
    const [ mood ] = await fetchMoodInfoById(id)

    // Check if it exists
    if(!mood) {
        ctx.apiError('invalid_mood')
        return
    }

    // Fetch character
    const [ char ] = await fetchCharacterInfoById(mood.character)

    // Make sure the character was actually fetched
    if(!char) {
        console.error(`Failed to fetch the character with ID ${mood.character}. This shouldn't happen.`)
        ctx.apiError('internal_error')
        return
    }

    // Delete mood
    await deleteMood(mood)

    // If character's default mood is the one that just got deleted, try to set it to another mood for that character, or set to null if no more are left
    if(char.default === id) {
        if(char.moods > 1) {
            // Fetch moods for character, and set default to the first one
            const [ firstMood ] = await fetchMoodInfosByCharacter(char.id, 0, 1, MoodOrder.NAME_ASC)
            await updateCharacterDefaultById(char.id, firstMood.id)
        } else {
            // Nothing can be done, set default to null
            await updateCharacterDefaultById(char.id, null)
        }
    }

    // Clear caches
    clearMoodCaches()

    // Success
    ctx.apiSuccess()
}