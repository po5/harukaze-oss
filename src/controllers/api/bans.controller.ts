import { Context, Next } from 'koa';
import {
    fetchBannedUserInfos,
    fetchBannedUsersCount,
    fetchUserByUsername,
    updateUserBannedById
} from 'models/users.model'
import { isTrue, setToArray } from 'utils/misc.util'
import { extractOffsetAndLimit } from 'utils/pagination.util'
import { MAX_API_PAGINATION_LIMIT } from 'root/constants'
import { createBans, deleteBansByIps, fetchBanInfos, fetchBansCount } from 'models/ipbans.model'
import { fetchUniqueIpLoginInfosByUser } from 'models/userlogins.model'

/**
 * Extracts IPs from the body
 * @param body The body
 */
async function extractIps(body: any): Promise<string[]> {
    let ips: string[]

    if(body.ip) {
        ips = [ body.ip ]
    } else if(body.ips) {
        ips = setToArray(body.ips)
    } else {
        // Fetch user's IPs
        const logins = await fetchUniqueIpLoginInfosByUser(parseInt(body.user, 10))

        // Add IPs
        ips = new Array(logins.length)
        for(let i = 0; i < logins.length; i++)
            ips[i] = logins[i].ip
    }

    return ips
}

/**
 * GET controller for banned user listing
 * @param ctx The context
 * @param _next The next function
 */
export async function getBannedUsers(ctx: Context, _next: Next) {
    // Collect data
    const { offset, limit } = extractOffsetAndLimit(ctx.request.query, MAX_API_PAGINATION_LIMIT)

    // Fetch total banned users
    const total = await fetchBannedUsersCount()

    // Fetch banned users
    const users = await fetchBannedUserInfos(offset, limit)

    // Send success
    ctx.apiSuccess({ users, total })
}

/**
 * POST controller for user banning and unbanning
 * @param ctx The context
 * @param _next The next function
 */
export async function postSetUserBan(ctx: Context, _next: Next) {
    const body = ctx.request.body
    
    // Check for correct data
    if(body.username === undefined || body.banned === undefined) {
        ctx.apiError('missing_params')
        return
    }

    const username = body.username as string
    const banned = isTrue(body.banned)

    // Make sure user cannot ban self
    if(username.toLowerCase() === ctx.state.user.username.toLowerCase()) {
        ctx.apiError('cannot_ban_self')
        return
    }

    // Fetch user
    const [ user ] = await fetchUserByUsername(username)

    // Check if user exists
    if(!user) {
        ctx.apiError('invalid_user')
        return
    }

    // Update user ban
    await updateUserBannedById(user.id, banned)

    // Success
    ctx.apiSuccess()
}

/**
 * GET controller for banned IP listing
 * @param ctx The context
 * @param _next The next function
 */
 export async function getBannedIps(ctx: Context, _next: Next) {
    // Collect data
    const { offset, limit } = extractOffsetAndLimit(ctx.request.query, MAX_API_PAGINATION_LIMIT)

    // Fetch total banned IPs
    const total = await fetchBansCount()

    // Fetch banned IPs
    const ips = await fetchBanInfos(offset, limit)

    // Send success
    ctx.apiSuccess({ ips, total })
}

/**
 * POST controller for IP banning
 * @param ctx The context
 * @param _next The next function
 */
export async function postCreateIpBan(ctx: Context, _next: Next) {
    const body = ctx.request.body
    
    // Check for correct data
    if(!body.ip && !body.ips && isNaN(body.user)) {
        ctx.apiError('missing_params')
        return
    }

    const ips = await extractIps(body)

    // Check if there are any IPs to ban at all
    if(ips.length < 1) {
        ctx.apiError('no_ips')
        return
    }

    // Ban IPs
    await createBans(ips)

    // Success
    ctx.apiSuccess()
}

/**
 * POST controller for IP unbanning
 * @param ctx The context
 * @param _next The next function
 */
export async function postDeleteIpBan(ctx: Context, _next: Next) {
    const body = ctx.request.body

    // Check for correct data
    if(!body.ip && !body.ips && isNaN(body.user)) {
        ctx.apiError('missing_params')
        return
    }

    const ips = await extractIps(body)

    // Unban IPs
    await deleteBansByIps(ips)

    // Success
    ctx.apiSuccess()
}