import argon2 from 'argon2'
import { createUser as createUserRow, updateUserHashById } from '../models/users.model'
import { Context } from 'koa'
import { getCharacterById, getMoodsByCharacter } from './moods.util'


/**
 * User roles
 */
export enum UserRoles {
    /**
     * Normal user
     */
    USER,

    /**
     * Site contributor
     */
    CONTRIBUTOR,

    /**
     * Site administrator
     */
    ADMIN
}

/**
 * The total number of user roles.
 * This should be used instead of using Object.keys because the enum generates reverse mappings for each key, meaning the key count is doubled.
 */
export const UserRolesCount = Object.keys(UserRoles).length/2

/**
 * All user role IDs.
 * This should be used instead of using Object.values because the enum generates reverse mappings for each key, meaning the values will also contain key names.
 */
export const UserRoleIds = Object.values(UserRoles).filter(val => typeof val === 'number') as number[]

/**
 * Creates a new user
 * @param username The user's username
 * @param bio The user's bio (can be null)
 * @param password The user's password
 * @param role The user's role (values defined in Roles object)
 * @param avatarKey The user's avatar key (can be null)
 * @param character The user's character ID
 */
export async function createUser(username: string, bio: string | null, password: string, role: UserRoles, avatarKey: string | null, character: number) {
    // Hash password
    let hash = await argon2.hash(password)

    // Create user DB entry
    await createUserRow(username, bio, hash, role, avatarKey, null, character)
}

/**
 * Tests whether the provided username is valid
 * @param username The username to test
 * @returns Whether the username is valid
 */
export function isUsernameValid(username: string): boolean {
    return /^[a-zA-Z0-9_-]{1,16}$/g.test(username)
}

/**
 * Identifies a context using a user row returned from the users model
 * @param ctx The context to identify
 * @param userRow The database row
 */
export async function identifyContextWithUserRow(ctx: Context, userRow: any) {
    ctx.user = userRow

    // Fetch user's character
    let char = await getCharacterById(userRow.user_character)

    ctx.state.user = {
        id: userRow.id,
        username: userRow.user_username,
        bio: userRow.user_bio,
        role: userRow.user_role,
        avatarKey: userRow.user_avatar_key,
        character: userRow.user_character,
        characterName: (char || {}).name || null,
        characterDefault: (char || {}).default || null,
        characterMoods: await getMoodsByCharacter(userRow.user_character),
        info: userRow.user_info,
        banned: userRow.user_banned === 1,
        createdOn: new Date(userRow.user_created_on)
    }
}

/**
 * Changes a user's password
 * @param id The user's ID
 * @param password The new password
 */
export async function changeUserPassword(id: number, password: string) {
    // Hash password
    let hash = await argon2.hash(password)

    // Update hash
    await updateUserHashById(id, hash)
}