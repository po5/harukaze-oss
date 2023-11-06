import { Context, Next } from 'koa'
import { MAX_API_PAGINATION_LIMIT } from 'root/constants'
import { extractOffsetAndLimit } from 'utils/pagination.util'
import { setToArray } from 'utils/misc.util'
import { UserRoleIds, UserRolesCount } from 'utils/users.util'
import {
    fetchUserByUsername,
    fetchUserInfosByRoles,
    fetchUsersCountByRoles,
    updateUserRoleById
} from 'models/users.model'

/**
 * GET controller for user listing
 * @param ctx The context
 * @param _next The next function
 */
export async function getUsers(ctx: Context, _next: Next) {
    // Collect data
    const body = ctx.request.query
    const { offset, limit } = extractOffsetAndLimit(body, MAX_API_PAGINATION_LIMIT)

    // Determine if roles are specified
    let roles: number[]
    const roleParamInt = parseInt(body.role as string, 10)
    if(!isNaN(roleParamInt)) {
        roles = [ roleParamInt ]
    } else if(body.roles) {
        roles = []
        const tmp = setToArray(body.roles as string)
        for(const role of tmp) {
            const roleInt = parseInt(role, 10)
            if(!isNaN(roleInt))
                roles.push(roleInt)
        }
    } else {
        roles = UserRoleIds
    }

    // Fetch total users
    const total = await fetchUsersCountByRoles(roles)

    // Fetch users
    const users = await fetchUserInfosByRoles(roles, offset, limit)

    // Send success
    ctx.apiSuccess({ users, total })
}

/**
 * POST controller for setting user roles
 * @param ctx The context
 * @param _next The next function
 */
export async function postSetRole(ctx: Context, _next: Next) {
    const body = ctx.request.body
    
    // Check for correct data
    let role = parseInt(body.role, 10)
    const delta = parseInt(body.delta, 10)
    const username = body.username as string | undefined
    if(username === undefined || (isNaN(role) && isNaN(delta))) {
        ctx.apiError('missing_params')
        return
    }

    // Make sure user cannot modify self
    if(username.toLowerCase() == ctx.state.user.username.toLowerCase()) {
        ctx.apiError('cannot_change_self')
        return
    }

    // Fetch user
    const [ user ] = await fetchUserByUsername(username)

    // Check if user exists
    if(!user) {
        ctx.apiError('invalid_user')
        return
    }

    // Use delta if specified
    if(!isNaN(delta))
        role = user.user_role+delta

    // Validate role
    if(role < 0 || role >= UserRolesCount) {
        ctx.apiError('invalid_role')
        return
    }

    // Update user role
    await updateUserRoleById(user.id, role)

    // Success
    ctx.apiSuccess()
}