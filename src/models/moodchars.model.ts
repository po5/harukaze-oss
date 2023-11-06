import Knex, { Knex as KnexType } from 'knex'
import config from '../../knexfile'

const knex = Knex(config)

/**
 * Info about a mood character
 */
export type MoodCharInfo = {
    /**
     * The character ID
     */
    id: number,

    /**
     * The character name
     */
    name: string,

    /**
     * The character's default mood ID
     */
    default: number,
    /**
     * The character's default mood name
     */
    default_name: string | null,

    /**
     * The character creator's ID
     */
    creator: number,
    /**
     * The character creator's username
     */
    creator_username: string | null,

    /**
     * The number of moods the character has
     */
    moods: number,

    /**
     * The date the character was created on
     */
    created_on: Date
}

/**
 * Orders mood character results can be returned in
 */
export enum MoodCharOrder {
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
function charInfo(): KnexType.QueryInterface {
    return knex('moodchars')
        .select('moodchars.id')
        .select(knex.ref('char_name').as('name'))
        .select(knex.ref('char_default').as('default'))
        .select(knex.ref('char_creator').as('creator'))
        .select(knex.ref('user_username').as('creator_username'))
        .select(knex.ref('char_created_on').as('created_on'))
        .select(knex.raw(`(
            SELECT mood_name
            FROM moods
            WHERE moods.id = char_default
            LIMIT 1
        ) AS default_name`))
        .select(knex.raw(`(
            SELECT COUNT(*)
            FROM moods
            WHERE mood_character = moodchars.id
        ) AS moods`))
        .leftJoin('users', 'char_creator', 'users.id')
}
/**
 * @param rows
 */
function processCharInfoRows(rows: any[]): MoodCharInfo[] {
    for(const row of rows)
        row.created_on = new Date(row.created_on)
    return rows
}
/**
 * @param order
 */
function orderBy(order: MoodCharOrder): string {
    switch(order) {
    case MoodCharOrder.CREATED_DESC:
        return 'moodchars.char_created_on DESC'
    case MoodCharOrder.NAME_ASC:
        return 'moodchars.char_name ASC'
    case MoodCharOrder.NAME_DESC:
        return 'moodchars.char_name DESC'
    default:
        return 'moodchars.char_created_on ASC'
    }
}

/**
 * Creates a new character
 * @param name The name
 * @param creator The creator's ID
 */
export async function createCharacter(name: string, creator: number) {
    return knex('moodchars')
        .insert({
            char_name: name,
            char_creator: creator
        })
}

/**
 * Fetches the character's info with the specified ID
 * @param id The ID
 * @returns An array with the row containing the character's info or an empty array if none exists
 */
export async function fetchCharacterInfoById(id: number): Promise<[ MoodCharInfo? ]> {
    return processCharInfoRows(
        await charInfo()
            .where('moodchars.id', id)
    ) as [ MoodCharInfo? ]
}

/**
 * Fetches all characters' info
 * @param offset The offset to return results
 * @param limit The amount of results to return
 * @param order The order of results to return
 * @returns All characters' info
 */
export async function fetchCharacterInfos(offset: number, limit: number, order: MoodCharOrder): Promise<MoodCharInfo[]> {
    return processCharInfoRows(
        await charInfo()
            .offset(offset)
            .limit(limit)
            .orderByRaw(orderBy(order))
    )
}

/**
 * Fetches all characters' info with a default mood
 * @param offset The offset to return results
 * @param limit The amount of results to return
 * @param order The order of results to return
 * @returns All characters' info with a default mood
 */
export async function fetchCharacterInfosWithDefault(offset: number, limit: number, order: MoodCharOrder): Promise<MoodCharInfo[]> {
    return processCharInfoRows(
        await charInfo()
            .whereNotNull('char_default')
            .offset(offset)
            .limit(limit)
            .orderByRaw(orderBy(order))
    )
}

/**
 * Fetches the amount of characters
 * @returns The amount of characters
 */
export async function fetchCharactersCount(): Promise<number> {
    return (
        await knex('moodchars')
            .count('*', { as: 'count' })
    )[0].count as number
}

/**
 * Updates a character's default mood
 * @param id The character's ID
 * @param defaultMood The new default mood's ID (can be null)
 */
export async function updateCharacterDefaultById(id: number, defaultMood: number | null = null) {
    return knex('moodchars')
        .update({
            char_default: defaultMood
        })
        .where('id', id)
}

/**
 * Deletes the character with the specified ID
 * @param id The character ID
 */
export async function deleteCharacterById(id: number) {
    return knex('moodchars')
        .del()
        .where('moodchars.id', id)
}