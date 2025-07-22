import { Context, Next, Middleware } from 'koa'
import { UserRoles } from 'utils/users.util'

/**
 * Creates a new protect middleware, using the provided routes.
 * The provided array should be an array of arrays.
 * Each route array's first element should be either a string or a RegExp object, representing the route or route pattern.
 * The second should be the Role required to access it.
 * @param routes An array of routes to protect
 * @param useRedirectOrNext Whether to redirect to the login page instead of returning 403, or pass to the next handler if the user is logged in but does not meet the required role
 * @returns The newly created protect middleware
 */
export function protectMiddleware(routes: [ (string | RegExp), UserRoles ][], useRedirectOrNext: boolean = false): Middleware {
    /**
     * The route protection middleware function
     * @param ctx The context
     * @param next The next function
     */
    async function middleware(ctx: Context, next: Next) {
        let path = ctx.path

        // Strip query string from path if present
        const queryIndex = path.indexOf('?')
        if(queryIndex > 0)
            path = path.substring(0, queryIndex)

        for(const routeInfo of routes) {
            const [ route, role ] = routeInfo

            // Test path against route
            let matches = route instanceof RegExp
                ? route.test(path)
                : route === path

            // Send forbidden if requirements aren't met
            if(matches && (!ctx.state.authed || ctx.state.user.role < role)) {
                if(useRedirectOrNext) {
                    if(ctx.state.authed)
                        await next()
                    else
                        ctx.redirect('/login?next='+encodeURIComponent(ctx.path))
                } else {
                    ctx.status = 403
                }

                return
            }
        }

        await next()
    }

    return middleware
}