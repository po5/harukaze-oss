import config from '../../knexfile'
import Knex, { Knex as KnexType } from 'knex'
import { UserRoles } from 'utils/users.util'
import { firstOrNull } from 'utils/misc.util'

const knex = Knex(config)

/**
 * A raw user row
 */
export interface UserRow {
    /**
     * The user's ID (formatted as a string because it's a BigInt)
     */
    id: string

    /**
     * The user's username
     */
    user_username: string

    /**
     * The user's bio, or null if none
     */
    user_bio: string | null

    /**
     * The user's password hash
     */
    user_hash: string

    /**
     * The user's role
     */
    user_role: number

    /**
     * The key for the user's avatar on disk, or null if the user has no avatar
     */
    user_avatar_key: string | null

    /**
     * Whether the user is banned (formatted as a string because it's a TinyInt)
     */
    user_banned: number

    /**
     * The user's creation date formatted an ISO 8601 date string
     */
    user_created_on: string

    /**
     * The user's info field, or null if none
     */
    user_info: string | null

    /**
     * The user's avatar comment character ID, or -1 if none
     */
    user_character: number | null
}

/**
 * Info about a user
 */
export interface UserInfo {
    /**
     * The user's ID
     */
    id: string

    /**
     * The user's ID
     */
    username: string

    /**
     * The user's bio, or null if none
     */
    bio: string | null

    /**
     * The user's Role ID
     */
    role: UserRoles

    /**
     * The user's avatar key, or null if they have no avatar
     */
    avatar_key: string | null

    /**
     * The user character's ID
     */
    character: number

    /**
     * The user character's name
     */
    character_name: string | null

    /**
     * The user character's default mood ID
     */
    character_default: number | null

    /**
     * The user's info text, or null if none
     */
    info: string | null

    /**
     * Whether the user is banned
     */
    banned: boolean

    /**
     * The total number of comments the user has made
     */
    comments: number

    /**
     * The last IP the user logged in with, or null if they never logged in
     */
    last_ip: string | null

    /**
     * The date the user was created on
     */
    created_on: Date
}

/**
 * Basic information about a user
 */
export interface UserBasicInfo {
    /**
     * The user's ID
     */
    id: string

    /**
     * The user's username
     */
    username: string

    /**
     * The user's role
     */
    role: UserRoles

    /**
     * Whether the user is banned
     */
    isBanned: boolean,

    /**
     * The user's creation date
     */
    createdOn: Date
}

/* Utility functions */
function userInfo(): KnexType.QueryInterface {
    return knex('users')
        .select('users.id')
        .select(knex.ref('user_username').as('username'))
        .select(knex.ref('user_bio').as('bio'))
        .select(knex.ref('user_role').as('role'))
        .select(knex.ref('user_avatar_key').as('avatar_key'))
        .select(knex.ref('user_character').as('character'))
        .select(knex.ref('char_name').as('character_name'))
        .select(knex.ref('char_default').as('character_default'))
        .select(knex.ref('user_info').as('info'))
        .select(knex.ref('user_banned').as('banned'))
        .select(knex.ref('user_created_on').as('created_on'))
        .select(knex.raw(`(
            SELECT COUNT(*)
            FROM comments
            WHERE comment_author = users.id
        ) AS comments`))
        .select(knex.raw(`(
            SELECT login_ip FROM userlogins
            WHERE login_user = users.id
            ORDER BY id DESC
            LIMIT 1
        ) AS last_ip`))
        .leftJoin('moodchars', 'user_character', 'moodchars.id')
}
function processUserInfoRows(rows: any[]): UserInfo[] {
    for(const row of rows) {
        row.created_on = new Date(row.created_on)
    }
    return rows
}

function userBasicInfo(): KnexType.QueryInterface {
    return knex('users')
        .select('users.id')
        .select(knex.ref('user_username').as('username'))
        .select(knex.ref('user_role').as('role'))
        .select(knex.ref('user_banned').as('isBanned'))
        .select(knex.ref('user_created_on').as('createdOn'))
}
function processUserBasicInfoRows(rows: any[]): UserBasicInfo[] {
    for (const row of rows) {
        row.createdOn = new Date(row.createdOn)
        row.isBanned = !!row.isBanned
    }
    return rows
}

/**
 * Creates a new user entry.
 * To create a new user normally, you should use createUser in users.util.ts
 * @param username The user's username
 * @param bio The user's bio (can be null)
 * @param hash The user's password hash
 * @param role The user's role (values defined in Roles object)
 * @param avatarKey The user's avatar key (can be null)
 * @param info The user's info (can be null)
 * @param character The user's character ID
 * @returns {} The newly created user's ID
 */
export async function createUser(username: string, bio: string | null, hash: string, role: UserRoles, avatarKey: string | null, info: string | null, character: number): Promise<string> {
    return (await knex('users')
        .insert({
            user_username: username,
            user_bio: bio,
            user_hash: hash,
            user_role: role,
            user_avatar_key: avatarKey,
            user_info: info,
            user_character: character
        })
        .returning('id'))[0].id
}

/**
 * Fetches a user by its ID (raw)
 * @param id The user's ID
 * @returns An array with the row containing the user or an empty array if none exists
 */
export async function fetchUserById(id: number): Promise<[ UserRow? ]> {
    return await knex('users')
        .select('*')
        .where('id', id) as [ UserRow? ]
}

/**
 * Fetches a user's info by its ID
 * @param id The user's ID
 * @returns An array with the row containing the user's info or an empty array if none exists
 */
export async function fetchUserInfoById(id: number): Promise<[ UserInfo? ]> {
    return processUserInfoRows(
        await userInfo()
            .where('id', id)
    ) as [ UserInfo? ]
}

/**
 * Fetches a user by its username (raw)
 * @param username The user's username
 * @returns An array with the row containing the user or an empty array if none exists
 */
export async function fetchUserByUsername(username: string): Promise<[ UserRow? ]> {
    return await knex('users')
        .select('*')
        .where(knex.raw('LOWER(user_username)') as any, username.toLowerCase()) as [ UserRow? ]
}

/**
 * Fetches a user's info by its username
 * @param username The user's username
 * @returns An array with the row containing the user's info or an empty array if none exists
 */
export async function fetchUserInfoByUsername(username: string): Promise<[ UserInfo? ]> {
    return processUserInfoRows(
        await userInfo()
            .where(knex.raw('LOWER(user_username)') as any, username)
    ) as [ UserInfo? ]
}

/**
 * Fetches all contributors' info
 * @param offset The offset to return results
 * @param limit The amount of results to return
 * @returns All contributors' info
 */
export async function fetchContributorInfos(offset: number, limit: number): Promise<UserInfo[]> {
    return processUserInfoRows(
        await userInfo()
            .where('user_role', UserRoles.CONTRIBUTOR)
            .orWhere('user_role', UserRoles.ADMIN)
            .offset(offset)
            .limit(limit)
    )
}

/**
 * Fetches all admins' info
 * @param offset The offset to return results
 * @param limit The amount of results to return
 * @returns All admins' info
 */
export async function fetchAdminInfos(offset: number, limit: number): Promise<UserInfo[]> {
    return processUserInfoRows(
        await userInfo()
            .orWhere('user_role', UserRoles.ADMIN)
            .offset(offset)
            .limit(limit)
    )
}

/**
 * Fetches a user by its ID and a row containing when the provided IP was banned, or null if not banned (raw)
 * @param id The user's ID
 * @param ip The IP to check if banned (or null to check if IP is not banned)
 * @returns An array with the row containing the user or an empty array if none exists
 */
export async function fetchUserAndIpBanById(id: number, ip: string | null): Promise<[ ({ ban_created_on: string } & UserRow)? ]> {
    return await knex('users')
        .select('*')
        .select(knex.raw(`(
            SELECT ban_created_on
            FROM ipbans
            WHERE ip = ?
        ) as ban_created_on`, [ip]))
        .where('id', id) as [ any? ]
}

/**
 * Fetches a user by its username and a row containing when the provided IP was banned, or null if not banned (raw)
 * @param username The user's username
 * @param ip The IP to check if banned (or null to check if IP is not banned)
 * @returns An array with the row containing the user or an empty array if none exists
 */
export async function fetchUserAndIpBanByUsername(username: string, ip: string | null): Promise<[ ({ ban_created_on: string } & UserRow)? ]> {
    return await knex('users')
        .select('*')
        .select(knex.raw(`(
            SELECT ban_created_on
            FROM ipbans
            WHERE ip = ?
        ) as ban_created_on`, [ip]))
        .where('user_username', username) as [ any? ]
}

/**
 * Fetches all banned users' info
 * @param offset The offset to return results
 * @param limit The amount of results to return
 * @returns All banned users' info
 */
export async function fetchBannedUserInfos(offset: number, limit: number): Promise<UserInfo[]> {
    return processUserInfoRows(
        await userInfo()
            .where('user_banned', true)
            .offset(offset)
            .limit(limit)
            .orderBy('created_on', 'desc')
    )
}

/**
 * Fetches all users' info with the specified roles
 * @param roles The roles
 * @param offset The offset to return results
 * @param limit The amount of results to return
 * @returns All users' info with the specified roles
 */
export async function fetchUserInfosByRoles(roles: UserRoles[], offset: number, limit: number): Promise<UserInfo[]> {
    return processUserInfoRows(
        await userInfo()
            .whereIn('user_role', roles)
            .offset(offset)
            .limit(limit)
    )
}

/**
 * Fetches basic info about the user with the specified ID, or null if none exists
 * @param id The user's ID
 * @returns {} The user's basic info
 */
export async function fetchUserBasicInfoById(id: string): Promise<UserBasicInfo | null> {
    return firstOrNull(processUserBasicInfoRows(
        await userBasicInfo()
            .where('id', id)
    ))
}

/**
 * Fetches basic info about the user with the specified username, or null if none exists
 * @param username The user's username
 * @returns {} The user's basic info
 */
export async function fetchUserBasicInfoByUsername(username: string): Promise<UserBasicInfo | null> {
    return firstOrNull(processUserBasicInfoRows(
        await userBasicInfo()
            .where('user_username', username)
    ))
}

/**
 * Fetches basic info about all users whose IDs are greater than the specified ID
 * @param id The ID to start from
 * @returns {} All users' basic info
 */
export async function fetchUserBasicInfosWhereIdMoreThan(id: string): Promise<UserBasicInfo[]> {
    return processUserBasicInfoRows(
        await userBasicInfo()
            .where('id', '>', id)
            .orderBy('id', 'asc')
    )
}

/**
 * Returns the total amount of users
 * @returns The total amount of users
 */
export async function fetchUsersCount(): Promise<number> {
    return (
        await knex('users')
            .count('*', { as: 'count' })
    )[0].count as number
}

/**
 * Returns the total amount of banned users
 * @returns The total amount of banned users
 */
export async function fetchBannedUsersCount(): Promise<number> {
    return (await knex('users')
        .where('user_banned', true)
        .count('*', { as: 'count' })
    )[0].count as number
}

/**
 * Returns the total amount of users with the specified roles
 * @param roles The roles
 * @returns The total amount of users with the specified roles
 */
export async function fetchUsersCountByRoles(roles: UserRoles[]): Promise<number> {
    return (await knex('users')
        .whereIn('user_role', roles)
        .count('*', { as: 'count' })
    )[0].count as number
}

/**
 * Updates a user's password hash.
 * To change a user's password, you should use changeUserPassword in users.util.ts.
 * @param id The user's ID
 * @param hash The new password hash
 */
export async function updateUserHashById(id: string, hash: string) {
    return knex('users')
        .update({
            user_hash: hash
        })
        .where('id', id)
}

/**
 * Updates a user's info
 * @param id The user's ID
 * @param bio The user's new bio (can be null)
 * @param character The user's new character ID
 * @param info The user's new info (can be null)
 */
export async function updateUserInfoById(id: string, bio: string | null, character: number, info: string | null) {
    return knex('users')
        .update({
            user_bio: bio,
            user_character: character,
            user_info: info
        })
        .where('id', id)
}

/**
 * Updates a user's avatar key
 * @param id The user's ID
 * @param avatarKey The user's new avatar key (or null for none)
 */
export async function updateUserAvatarKeyById(id: number, avatarKey: string | null) {
    return knex('users')
        .update({
            user_avatar_key: avatarKey
        })
        .where('id', id)
}

/**
 * Updates whether a user is banned
 * @param id The user's ID
 * @param banned Whether the user is banned
 */
export async function updateUserBannedById(id: string, banned: boolean) {
    return knex('users')
        .update({
            user_banned: banned
        })
        .where('id', id)
}

/**
 * Updates a user's role
 * @param id The user's ID
 * @param role The user's new role
 * @returns Whether the account exists and was updated
 */
export async function updateUserRoleById(id: string, role: UserRoles) {
    return (
        await knex('users')
            .update({
                user_role: role
            })
            .where('id', id)
    ) > 0
}

/**
 * Updates a user's username
 * @param id The user's ID
 * @param newUsername The user's new username
 * @returns Whether the account exists and was updated
 */
export async function updateUserUsernameById(id: string, newUsername: string): Promise<boolean> {
    return (
        await knex('users')
            .update({
                user_username: newUsername
            })
            .where('id', id)
    ) > 0
}

/**
 * Updates all users with the specified old ID to use the provided new ID
 * @param oldChar The old character ID to replace
 * @param newChar The new character ID
 * @returns The number of users that were updated
 */
export async function updateUserCharacterByCharacter(oldChar: number, newChar: number) {
    return knex('users')
        .update({
            user_character: newChar
        })
        .where('user_character', oldChar)
}

/**
 * Converts a {@link UserRow} object to a {@link UserBasicInfo} object
 * @param row The {@link UserRow} object
 * @returns The resulting {@link UserBasicInfo} object
 */
export function userRowToBasicInfo(row: UserRow): UserBasicInfo {
    return {
        id: row.id,
        username: row.user_username,
        role: row.user_role as UserRoles,
        isBanned: !!row.user_banned,
        createdOn: new Date(row.user_created_on),
    }
}

/**
 * Converts a {@link UserInfo} object to a {@link UserBasicInfo} object
 * @param info The {@link UserInfo} object
 * @returns The resulting {@link UserBasicInfo} object
 */
export function userInfoToUserBasicInfo(info: UserInfo): UserBasicInfo {
    return {
        id: info.id,
        username: info.username,
        role: info.role,
        isBanned: info.banned,
        createdOn: info.created_on,
    }
}
