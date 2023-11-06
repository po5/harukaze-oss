import config from '../../config.json'
import { Context, Next } from 'koa'
import { fetchPublishedPostInfos, PostOrder } from 'models/posts.model'

/**
 * GET controller for RSS feed
 * @param ctx The context
 * @param _next The next function
 */
export async function getRss(ctx: Context, _next: Next) {
    // Fetch posts
    const posts = await fetchPublishedPostInfos(false, 0, 10, PostOrder.CREATED_DESC)

    // Set content type
    ctx.type = 'application/rss+xml'

    // Figure out site root
    const root = `${ctx.protocol}://${ctx.host}`

    // Date format util
    function fmtDate(date: Date) {
        return date.toUTCString()
    }

    // Generate XML
    let postsXml = ''
    for(const post of posts)
        postsXml += `
        <item>
            <title>${post.title}</title>
            <link>${root}/blog/${post.slug}</link>
            <guid>${post.slug}</guid>
            <pubDate>${fmtDate(post.created_on)}</pubDate>
            <description>View on ${config.site.title}! Tags: ${post.tags.join(', ')}</description>
        </item>`

    ctx.body =
(`<rss version="2.0">
    <channel>
        <title>${config.site.title}</title>
        <link>${root}/home</link>
        <description>${config.site.description}</description>${postsXml}
    </channel>
</rss>`)
}
