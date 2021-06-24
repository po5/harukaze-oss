/**
 * Creates a new protect middleware, using the provided routes.
 * The provided array should be an array of arrays.
 * Arrays' first element should be either a string or a regex, representing the route or route pattern.
 * The second should be the role ID required to access it
 * @param {Array<Array>} routes An array of routes to protect
 * @return {Function} The newly created protect middleware
 */
module.exports = function protectMiddleware(routes) {
    /**
     * @param {import("koa").Context} ctx 
     * @param {Function} next 
     */
    async function middleware(ctx, next) {
        let path = ctx.path
        let queryIndex = path.indexOf('?')
        if(queryIndex > 0)
            path = path.substring(0, queryIndex)

        for(routeInfo of routes) {
            let route = routeInfo[0]
            let role = routeInfo[1]

            // Test path against route
            let matches = route instanceof RegExp ? route.test(path) : route == path

            // Send forbidden if requirements aren't met
            if(matches && (!ctx.state.authed || ctx.state.user.role < role)) {
                ctx.status = 403
                return
            }
        }

        await next()
    }

    return middleware
}