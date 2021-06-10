const config = require('../../config.json')
const usersModel = require('../models/users.model')

/**
 * Middleware that fetches data required for rendering pages
 * @param {import("koa").Context} ctx The context
 */
module.exports = async (ctx, next) => {
    // Site data
    ctx.state.site = config.site

    // Default page title to null
    ctx.state.pageTitle = null

    // Fetch contributors
    ctx.state.contributors = await usersModel.fetchContributorInfos(0, 99)
        
    await next()
}