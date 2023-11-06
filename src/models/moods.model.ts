import config from '../../knexfile'
import Knex, { Knex as KnexType } from 'knex'

const knex = Knex(config)

/**
 * Info about a mood
 */
export type MoodInfo = {
    /**
     * The mood ID
     */
    id: number,

    /**
     * The mood name
     */
    name: string,

    /**
     * The mood image's key
     */
    key: string,

    /**
     * The mood character's ID
     */
    character: number,

    /**
     * The mood character's name
     */
    character_name: string | null,

    /**
     * The mood creator's ID
     */
    creator: number,

    /**
     * The mood creator's username
     */
    creator_username: string | null,

    /**
     * The date the mood was created on
     */
    created_on: Date
}

/**
 * Orders mood results can be returned in
 */
export enum MoodOrder {
    /**
     * Creation time, ascending
     */
    CREATED_ASC,
    /**
     * Creation time, descending
     */
    CREATED_DESC,

    /**
     * Name alphabetically, ascending
     */
    NAME_ASC,
    /**
     * Name alphabetically, descending
     */
    NAME_DESC
}

/* Utility functions */
function moodInfo(): KnexType.QueryInterface {
    return knex('moods')
        .select('moods.id')
        .select(knex.ref('mood_name').as('name'))
        .select(knex.ref('mood_key').as('key'))
        .select(knex.ref('mood_character').as('character'))
        .select(knex.ref('char_name').as('character_name'))
        .select(knex.ref('mood_creator').as('creator'))
        .select(knex.ref('user_username').as('creator_username'))
        .select(knex.ref('mood_created_on').as('created_on'))
        .leftJoin('moodchars', 'mood_character', 'moodchars.id')
        .leftJoin('users', 'mood_creator', 'users.id')
}
/**
 * @param rows
 */
function processMoodInfoRows(rows: any[]): MoodInfo[] {
    for(const row of rows)
        row.created_on = new Date(row.created_on)
    return rows
}
/**
 * @param order
 */
function orderBy(order: MoodOrder): string {
    switch(order) {
    case MoodOrder.CREATED_DESC:
        return 'moods.mood_created_on DESC'
    case MoodOrder.NAME_ASC:
        return 'moods.mood_name ASC'
    case MoodOrder.NAME_DESC:
        return 'moods.mood_name DESC'
    default:
        return 'moods.mood_created_on ASC'
    }
}

/**
 * Creates a new mood entry
 * @param name The name
 * @param key The key of the underlying file on disk
 * @param character The ID of the character this mood belongs to
 * @param creator The creator's ID
 */
export async function createMood(name: string, key: string, character: number, creator: number) {
    return knex('moods')
        .insert({
            mood_name: name,
            mood_key: key,
            mood_character: character,
            mood_creator: creator
        })
}

/**
 * Fetches the mood's info with the specified ID
 * @param id The ID
 * @returns An array with the row containing the mood's info or an empty array if none exists
 */
export async function fetchMoodInfoById(id: number): Promise<[ MoodInfo? ]> {
    return processMoodInfoRows(
        await moodInfo()
            .where('moods.id', id)
    ) as [ MoodInfo? ]
}

/**
 * Fetches the mood's info with the specified key
 * @param key The key
 * @returns An array with the row containing the mood's info or an empty array if none exists
 */
export async function fetchMoodInfoByKey(key: string): Promise<[ MoodInfo? ]> {
    return processMoodInfoRows(
        await moodInfo()
            .where('mood_key', key)
    ) as [ MoodInfo? ]
}

/**
 * Fetches all moods' info
 * @param offset The offset to return results
 * @param limit The amount of results to return
 * @param order The order of results to return
 * @returns All moods' info
 */
export async function fetchMoodInfos(offset: number, limit: number, order: MoodOrder): Promise<MoodInfo[]> {
    return processMoodInfoRows(
        await moodInfo()
            .offset(offset)
            .limit(limit)
            .orderByRaw(orderBy(order))
    )
}

/**
 * Fetches all moods' info with the specified character
 * @param character The character ID
 * @param offset The offset to return results
 * @param limit The amount of results to return
 * @param order The order of results to return
 * @returns All moods' info
 */
export async function fetchMoodInfosByCharacter(character: number, offset: number, limit: number, order: MoodOrder): Promise<MoodInfo[]> {
    return processMoodInfoRows(
        await moodInfo()
            .where('mood_character', character)
            .offset(offset)
            .limit(limit)
            .orderByRaw(orderBy(order))
    )
}

/**
 * Fetches the amount of moods
 * @returns The amount of moods
 */
export async function fetchMoodsCount(): Promise<number> {
    return (
        await knex('moods')
            .count('*', { as: 'count' })
    )[0].count as number
}

/**
 * Deletes the mood with the specified ID
 * @param id The mood ID
 */
export async function deleteMoodById(id: number) {
    return knex('moods')
        .del()
        .where('moods.id', id)
}

/**
 * Deletes all moods with the specified character
 * @param character The character ID
 */
export async function deleteMoodsByCharacter(character: number) {
    return knex('moods')
        .del()
        .where('mood_character', character)
}