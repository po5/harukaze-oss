import { Context, Next, Middleware } from 'koa'

/**
 * Creates a new noCache middleware, using the provided routes.
 * The provided array should be an array of arrays.
 * Each route array's first element should be either a string or a RegExp object, representing the route or route pattern.
 * The second should be the Role required to access it.
 * @param routes An array of routes to disable caching on
 * @returns The newly created noCache middleware
 */
export function noCacheMiddleware(routes: (string | RegExp)[]): Middleware {
    /**
     * The route noCacheion middleware function
     * @param ctx The context
     * @param next The next function
     */
    async function middleware(ctx: Context, next: Next) {
        let path = ctx.path

        // Strip query string from path if present
        const queryIndex = path.indexOf('?')
        if(queryIndex > 0)
            path = path.substring(0, queryIndex)

        for(const route of routes) {
            // Test path against route
            let matches = route instanceof RegExp
                ? route.test(path)
                : route === path

            if(matches) {
                // Disable caching
                ctx.res.setHeader('Cache-control', 'no-store')
                ctx.res.setHeader('Pragma', 'no-cache')
            }
        }

        await next()
    }

    return middleware
}
