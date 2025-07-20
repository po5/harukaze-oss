import config from '../../knexfile'
import Knex, { Knex as KnexType } from 'knex'

const knex = Knex(config)

/**
 * Info about an IP ban
 */
export type IpBanInfo = {
    /**
     * The IP address
     */
    ip: string,

    /**
     * The date the ban record was created on
     */
    created_on: Date
}

/* Utility functions */
function banInfo(): KnexType.QueryInterface {
    return knex('ipbans')
        .select('ip')
        .select(knex.ref('ban_created_on').as('created_on'))
        .orderBy('created_on', 'desc')
}
function processBanInfoRows(rows: any[]): IpBanInfo[] {
    for(const row of rows)
        row.created_on = new Date(row.created_on)
    return rows
}

/**
 * Creates a new IP ban
 * @param ip The IP to ban
 */
export async function createBan(ip: string) {
    return knex('ipbans')
        .insert({ ip })
        .onConflict('ip')
        .ignore()
}

/**
 * Creates several new IP bans
 * @param ips The IPs to ban
 */
export async function createBans(ips: string[]) {
    let rows = new Array(ips.length)
    for(const i in ips)
        rows[i] = { ip: ips[i] }
    
    return knex('ipbans')
        .insert(rows)
        .onConflict('ip')
        .ignore()
}

/**
 * Fetches all IP bans (raw)
 * @param offset The offset to return results
 * @param limit The amount of results to return
 * @returns All bans
 */
export async function fetchBans(offset: number, limit: number): Promise<any[]> {
    return knex('ipbans')
        .select('*')
        .offset(offset)
        .limit(limit)
}

/**
 * Fetches info about all IP bans
 * @param offset The offset to return results
 * @param limit The amount of results to return
 * @returns All bans' info
 */
export async function fetchBanInfos(offset: number, limit: number): Promise<IpBanInfo[]> {
    return processBanInfoRows(
        await banInfo()
            .offset(offset)
            .limit(limit)
    )
}

/**
 * Fetches an IP ban by its IP (raw)
 * @param ip The IP
 * @returns An array with the row containing the IP ban or an empty array if none exists
 */
export async function fetchBanByIp(ip: string): Promise<[ any? ]> {
    return await knex('ipbans')
        .select('*')
        .where('ip', ip) as [ any? ]
}

/**
 * Fetches an IP ban's info by its IP
 * @param ip The IP
 * @returns An array with the row containing the ban's info or an empty array if none exists
 */
export async function fetchBanInfoByIp(ip: string): Promise<[ IpBanInfo? ]> {
    return processBanInfoRows(
        await banInfo()
            .where('ip', ip)
    ) as [ IpBanInfo? ]
}

/**
 * Returns the total amount of bans
 * @returns The total amount of bans
 */
export async function fetchBansCount(): Promise<number> {
    return (
        await knex('ipbans')
            .count('*', { as: 'count' })
    )[0].count as number
}

/**
 * Deletes the ban with the specified IP, if any
 * @param ip The IP
 */
export async function deleteBanByIp(ip: string) {
    return knex('ipbans')
        .del()
        .where('ip', ip)
}

/**
 * Deletes all bans with the specified IPs, if any
 * @param ips The IPs
 */
export async function deleteBansByIps(ips: string[]) {
    return knex('ipbans')
        .del()
        .whereIn('ip', ips)
}

/**
 * Deletes all IP bans
 */
export async function deleteAllBans() {
    return knex('ipbans')
        .del()
}