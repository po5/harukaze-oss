import argon2 from 'argon2'
import {
    createUser as createUserRow,
    updateUserBannedById,
    updateUserHashById,
    updateUserRoleById,
    updateUserUsernameById,
    fetchUserInfoByUsername,
    UserBasicInfo
} from '../models/users.model'
import { Context } from 'koa'
import { getCharacterById, getMoodsByCharacter } from './moods.util'
import {
    appSzurubooruClient,
    SzurubooruClientError,
    SzurubooruErrorName, SzurubooruIntegrityVersion,
    SzurubooruUserRank
} from 'utils/szurubooru.util'

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
 * Mappings of user roles to szurubooru ranks
 */
const roleToSzurubooruUserRankMappings = {
    [UserRoles.USER]: SzurubooruUserRank.Regular,
    [UserRoles.CONTRIBUTOR]: SzurubooruUserRank.Moderator,
    [UserRoles.ADMIN]: SzurubooruUserRank.Administrator,
}

/**
 * Returns the szurubooru rank equivalent of the provided user role
 * @param role The user role
 * @param isBanned Whether the user is banned (optional, but should be provided if available)
 * @returns {} The equivalent szurubooru rank
 */
function roleToSzurubooruUserRank(role: UserRoles, isBanned?: boolean): SzurubooruUserRank {
    if (isBanned) {
        return SzurubooruUserRank.Restricted
    } else {
        return roleToSzurubooruUserRankMappings[role] ?? SzurubooruUserRank.Regular
    }
}

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
    const id = await createUserRow(username, bio, hash, role, avatarKey, null, character)

    await syncSzurubooruUser({
        id,
        username,
        role,
        isBanned: false,
        createdOn: new Date(),
    }, password)
}

const validUsernameRegex = /^[a-zA-Z0-9_-]{1,16}$/

/**
 * Tests whether the provided username is valid
 * @param username The username to test
 * @returns Whether the username is valid
 */
export function isUsernameValid(username: string): boolean {
    return validUsernameRegex.test(username)
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
        createdOn: new Date(userRow.user_created_on),
    }
}

/**
 * Syncs szurubooru user info based on the provided user info.
 * If szurubooru integration is not enabled, this does nothing.
 * @param user The user's info
 * @param password The user's password (optional)
 * @param version The szurubooru user's current integrity version (optional, but should be provided if available)
 */
export async function syncSzurubooruUser(user: UserBasicInfo, password?: string, version?: SzurubooruIntegrityVersion) {
    if (appSzurubooruClient === null)
        return

    let charDefault = 5;

    try {
        const [ userInfo ] = await fetchUserInfoByUsername(user.username);
        if (userInfo) {
            charDefault = userInfo.character_default || 5;
        }
        await appSzurubooruClient.updateUser(user.username, {
            password,
            name: user.username,
            rank: roleToSzurubooruUserRank(user.role, user.isBanned),
            avatarStyle: `mood_${charDefault}`,
        }, version)
    } catch (err) {
        if (err instanceof SzurubooruClientError && password !== undefined && err.response.name === SzurubooruErrorName.UserNotFoundError) {
            // User was not found, but we have enough information to create a new user
            await appSzurubooruClient.createUser({
                password,
                name: user.username,
                rank: roleToSzurubooruUserRank(user.role, user.isBanned),
                avatarStyle: `mood_${charDefault}`,
            })
        } else {
            throw err
        }
    }
}

/**
 * Changes a user's password
 * @param user The user's info
 * @param password The new password
 */
export async function changeUserPassword(user: UserBasicInfo, password: string) {
    // Hash password
    let hash = await argon2.hash(password)

    await updateUserHashById(user.id, hash)

    await syncSzurubooruUser(user, password)
}

/**
 * Updates whether a user is banned
 * @param user The user's info
 * @param isBanned Whether the user is banned
 */
export async function updateUserBanned(user: UserBasicInfo, isBanned: boolean) {
    await updateUserBannedById(user.id, isBanned)

    await syncSzurubooruUser({ ...user, isBanned })
}

/**
 * Updates a user's role
 * @param user The user's info
 * @param role The user's new role
 */
export async function updateUserRole(user: UserBasicInfo, role: UserRoles) {
    await updateUserRoleById(user.id, role)

    await syncSzurubooruUser({ ...user, role })
}

/**
 * Updates a user's username
 * @param user The user's info
 * @param newUsername The user's new username
 */
export async function updateUserUsername(user: UserBasicInfo, newUsername: string) {
    await updateUserUsernameById(user.id, newUsername)

    if (appSzurubooruClient !== null) {
        await appSzurubooruClient.updateUser(user.username, {
            name: newUsername,
            rank: roleToSzurubooruUserRank(user.role, user.isBanned),
        })
    }
}
