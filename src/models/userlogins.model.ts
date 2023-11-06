import config from '../../knexfile'
import Knex, { Knex as KnexType } from 'knex'

const knex = Knex(config)

/**
 * Info about a user login
 */
export type UserLoginInfo = {
    /**
     * The user's ID
     */
    user: number,
    /**
     * The user's username
     */
    user_username: string | null,

    /**
     * The IP address that was used for the login
     */
    ip: string,

    /**
     * The date on which the login occurred
     */
    created_on: Date
}

/* Utility functions */
function loginInfo(): KnexType.QueryInterface {
    return knex('userlogins')
        .select(knex.ref('login_user').as('user'))
        .select('user_username')
        .select(knex.ref('login_ip').as('ip'))
        .select(knex.ref('login_created_on').as('created_on'))
        .leftJoin('users', 'login_user', 'users.id')
}
function processLoginInfoRows(rows: any[]): UserLoginInfo[] {
    for(let row of rows) {
        row.created_on = new Date(row.created_on)
    }
    return rows
}

/**
 * Creates a new login record for the specified user
 * @param user The user's ID
 * @param ip The IP used to login
 */
export async function createLogin(user: number, ip: string) {
    return knex('userlogins')
        .insert({
            login_user: user,
            login_ip: ip
        })
}

/**
 * Fetches all logins by the specified user with a unique IP address (raw)
 * @param user The user's ID
 * @returns All logins
 */
export async function fetchUniqueIpLoginsByUser(user: number): Promise<any[]> {
    return knex('userlogins')
        .select('*')
        .where('login_user', user)
        .groupBy('login_ip')
}

/**
 * Fetches all login infos by the specified user with a unique IP address
 * @param user The user's ID
 * @returns All logins' info
 */
export async function fetchUniqueIpLoginInfosByUser(user: number): Promise<UserLoginInfo[]> {
    return processLoginInfoRows(
        await loginInfo()
            .where('login_user', user)
            .groupBy('login_ip')
    )
}