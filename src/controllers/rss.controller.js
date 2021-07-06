const config = require('../../config.json')
const postsModel = require('../models/posts.model')

/**
 * GET controller for RSS feed
 * @param {import("koa").Context} ctx The context
 */
module.exports.getRss = async ctx => {
    // Fetch posts
    let posts = await postsModel.fetchPublishedPostInfos(false, 0, 10, postsModel.Order.CREATED_DESC)

    // Set content type
    ctx.type = 'application/rss+xml'

    // Figure out site root
    let root = `${ctx.protocol}${ctx.secure ? 's' : ''}://${ctx.host}`

    // Date format util
    function fmtDate(date) {
        return date.toUTCString()
    }

    // Generate XML
    let postsXml = ''
    for(post of posts)
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