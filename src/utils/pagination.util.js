const config = require('../../config.json')
const pageSize = config.pagination.pageSize
const utils = require('./misc.util')

/**
 * Returns information about this paginated route.
 * A paginated route looks like this: "/route/:page". "/route" is also valid, and is just understood as the first page.
 * 
 * Returned object contains the following:
 * 
 * page (number) - Current page, based on route param named "page", or 1 if not in route params
 * 
 * totalPages (number) - The total amount of pages
 * 
 * pageSize (number) - The page size used to calculate values
 * 
 * itemCount (number) - The amount of items available to paginate
 * 
 * basePath (string) - The base path, without a page number (e.g. "/route", even if currently on "/route/3")
 * 
 * nextPage (string) - The path of the next page (preserving query parameters), or null if on last page
 * 
 * lastPage (string) - The path of the last page (preserving query parameters), or null if on first page
 * 
 * queryOffset (number) - The offset that should be used in a paginated database query
 * 
 * queryLimit (number) - The limit that should be used in a paginated database query
 * 
 * @param {import('koa').Context} ctx The route context
 * @param {number} itemCount The amount of items available to paginate
 * @returns {Object} Information about the paginated route
 */
function paginatedRouteInfo(ctx, itemCount) {
    let page = 1
    let hasPageParam = false
    let totalPages = Math.max(1, Math.ceil(itemCount/pageSize))

    // Get page number from route param if available
    if(!isNaN(ctx.params.page)) {
        hasPageParam = true
        page = Math.max(1, ctx.params.page*1)
    }

    // Correct page number
    if(page > totalPages)
        page = Math.max(1, totalPages)

    // Current path
    let currentPath = utils.stripTrailingSlash(ctx.path)
    // Base path (path without page number)
    let basePath = hasPageParam ? currentPath.substring(0, currentPath.length-(page.toString().length+1)) : currentPath

    // Define page paths function
    let pageLink = function(num) {
        return basePath+'/'+num+(ctx.querystring.length > 0 ? '?'+ctx.querystring : '')
    }
    let lastPage = (page > 1) ? pageLink(page-1) : null
    let nextPage = (page < totalPages) ? pageLink(page+1) : null

    // Query offset and limits
    let queryOffset = (page-1)*pageSize
    let queryLimit = pageSize

    // Return everything
    return {
        page,
        totalPages,
        pageSize,
        itemCount,
        basePath,
        pageLink,
        nextPage,
        lastPage,
        queryOffset,
        queryLimit
    }
}

/* Export functions */
module.exports.paginatedRouteInfo = paginatedRouteInfo