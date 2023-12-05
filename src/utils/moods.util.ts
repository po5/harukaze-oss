import { fetchCharacterInfosWithDefault, MoodCharInfo, MoodCharOrder as MoodCharOrder } from '../models/moodchars.model'
import { fetchMoodInfos, MoodInfo, MoodOrder as MoodOrder } from '../models/moods.model'

/**
 * A {@link MoodCharInfo} object with all its moods
 */
export interface MoodCharInfoWithMoods extends MoodCharInfo {
    /**
     * All the character's moods
     */
    moodsList: MoodInfo[]

    /**
     * The character's default mood
     */
    defaultMood: MoodInfo
}

/**
 * The current characters cache
 */
let charsCache: MoodCharInfoWithMoods[] = []

/**
 * The current moods cache
 */
let moodsCache: MoodInfo[] = []

export async function _refreshMoodsCache() {
    moodsCache = await fetchMoodInfos(0, Number.MAX_SAFE_INTEGER, MoodOrder.CREATED_ASC)
}

export async function _refreshCharsCache() {
    charsCache = await fetchCharacterInfosWithDefault(0, Number.MAX_SAFE_INTEGER, MoodCharOrder.CREATED_ASC) as MoodCharInfoWithMoods[]

    if (moodsCache.length < 1)
        await _refreshMoodsCache()

    for (const char of charsCache) {
        char.moodsList = []
        for (const mood of moodsCache) {
            if (mood.character === char.id)
                char.moodsList.push(mood)

            if (mood.id === char.default)
                char.defaultMood = mood
        }
    }
}

/**
 * Clears all mood-related caches
 */
export function clearCaches() {
    charsCache = []
    moodsCache = []
}

/**
 * Returns all usable characters
 * @returns All usable characters
 */
export async function getUsableCharacters() {
    if(charsCache.length < 1)
        await _refreshCharsCache()

    return charsCache
}

/**
 * Returns the character with the specified ID or null if it doesn't exist
 * @param id The ID
 * @returns The character with the specified ID or null if it doesn't exist
 */
export async function getCharacterById(id: number): Promise<MoodCharInfo | null> {
    if(charsCache.length < 1)
        await _refreshCharsCache()

    for(let char of charsCache)
        if(char.id === id)
            return char

    return null
}

/**
 * Returns all moods
 * @returns All moods
 */
export async function getMoods(): Promise<MoodInfo[]> {
    if(moodsCache.length < 1)
        await _refreshMoodsCache()

    return moodsCache
}

/**
 * Returns all moods with the specified character
 * @param character The character ID
 * @returns All moods with the specified character
 */
export async function getMoodsByCharacter(character: number): Promise<MoodInfo[]> {
    if (moodsCache.length < 1)
        await _refreshMoodsCache()

    let moods = []
    for (const mood of moodsCache)
        if (mood.character === character)
            moods.push(mood)

    return moods
}

/**
 * Returns the mood with the specified ID or null if it doesn't exist
 * @param id The ID
 * @returns The mood with the specified ID or null if it doesn't exist
 */
export async function getMoodById(id: number): Promise<MoodInfo | null> {
    if(moodsCache.length < 1)
        await _refreshMoodsCache()

    for(let mood of moodsCache)
        if(mood.id === id)
            return mood

    return null
}
