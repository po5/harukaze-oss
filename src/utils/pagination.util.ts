import config from '../../config.json'
import { Context } from 'koa'
import { stripTrailingSlash } from './misc.util'

/**
 * Paginated route info
 */
export type PaginatedRouteInfo = {
    /**
     * The current page, based on route param/query named "page", or 1 if not in route params/query
     */
    page: number,

    /**
     * The total number of pages
     */
    totalPages: number,

    /**
     * The page size used to calculate values
     */
    pageSize: number,

    /**
     * The number of items available to paginate
     */
    itemCount: number,

    /**
     * The base path, without a page number (e.g. "/route", even if currently on "/route/3")
     */
    basePath: string,

    /**
     * Function to generate a page link based on the current pagination, using the specified page number
     */
    pageLink: (num: number) => string,

    /**
     * The path of the next page (preserving query parameters), or null if on last page
     */
    nextPage: string | null,
    /**
     * The path of the last page (preserving query parameters), or null if on first page
     */
    lastPage: string | null,

    /**
     * The offset that should be used in a paginated database query
     */
    queryOffset: number,
    /**
     * The limit that should be used in a paginated database query
     */
    queryLimit: number
}

/**
 * An offset and limit
 */
export type OffsetLimit = {
    /**
     * The offset (should not be below 0)
     */
    offset: number,

    /**
     * The limit (should not be below 1)
     */
    limit: number
}

/**
 * Returns information about this paginated route.
 * A paginated route looks like this: "/route/:page". "/route" is also valid, and is just understood as the first page.
 * Query params, such as "/route?page=1" are also valid
 *
 * @param ctx The route context
 * @param itemCount The amount of items available to paginate
 * @param useBooruSettings Whether to use booru settings (different page size, use query params instead of route params)
 * @returns Information about the paginated route
 */
export function paginatedRouteInfo(ctx: Context, itemCount: number, useBooruSettings: boolean = false): PaginatedRouteInfo {
    const pageSize = useBooruSettings ? config.pagination.booruPageSize : config.pagination.pageSize

    // Get the page number from query params if using booru settings, otherwise get from route params
    let page = parseInt(
        useBooruSettings
            ? ctx.request.query.page
            : ctx.params.page, 10
    )

    const hasPageParam = !isNaN(page)
    const totalPages = Math.max(1, Math.ceil(itemCount/pageSize))

    // Get page number from route param if available
    if(isNaN(page))
        page = 1
    else
        page = Math.max(1, page)

    // Correct page number
    if(page > totalPages)
        page = Math.max(1, totalPages)

    // Current path
    const currentPath = stripTrailingSlash(ctx.path)
    // Base path (path without page number)
    const basePath = hasPageParam
        ? currentPath.substring(0, currentPath.length-(page.toString().length+1))
        : currentPath

    // Define page paths function
    const pageLink = function(num: number): string {
        if(useBooruSettings) {
            // Copy query params, change page, and re-serialize them
            const query = { ...ctx.query }
            query.page = num.toString()
            let queryStr = ''
            const keys = Object.keys(query)
            for(const key of keys)
                queryStr += `&${key}=${encodeURIComponent(query[key] as string)}`
            if(queryStr.length > 0)
                queryStr = '?'+queryStr.substring(1)

            return basePath+queryStr
        } else {
            return basePath+'/'+num+(ctx.querystring.length > 0 ? '?'+ctx.querystring : '')
        }
    }
    const lastPage = (page > 1) ? pageLink(page-1) : null
    const nextPage = (page < totalPages) ? pageLink(page+1) : null

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
        queryOffset: (page-1)*pageSize,
        queryLimit: pageSize
    }
}

/**
 * Extracts offset and limit parameters from an object
 * @param obj The object
 * @param maxLimit The maximum limit to use
 */
export function extractOffsetAndLimit(obj: any, maxLimit: number): OffsetLimit {
    // Ensure offset and limit are ints
    const offsetInt = typeof obj.offset === 'number'
        ? obj.offset
        : parseInt(obj.offset as string, 10)
    const limitInt = typeof obj.limit === 'number'
        ? obj.limit
        : parseInt(obj.limit as string, 10)

    return {
        offset: isNaN(offsetInt) ? 0 : Math.max(offsetInt, 0),
        limit: isNaN(limitInt) ? 50 : Math.min(Math.max(limitInt, 0), maxLimit)
    }
}