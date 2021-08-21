const Router = require('koa-router')
const ejs = require('ejs')
const path = require('path')

const { renderTemplate } = require('./utils/render.util')
const { apiRes, apiError } = require('./utils/api.util')

const ajaxTagsController = require('./controllers/booru/tags.controller')
const ajaxCommentsController = require('./controllers/booru/comments.controller')

// Prefix for all routes
const prefix = '/booru'

/**
 * Renders a template with the provided context
 * @param {string} template The name of the template to render
 * @param {import('koa').Context} ctx The context to render with
 */
async function render(template, ctx) {
    // Don't do anything if noRender is true
    if(!ctx.state.noRender) {
        ctx.type = 'text/html; charset=utf-8'

        // Render template
        let body = await renderTemplate('/booru/'+template, ctx.state)

        // Render layout with template
        ctx.body = await renderTemplate('/booru/layout', {
            body,
            ...ctx.state
        })
    }
}

/**
 * Sets up routes for the application
 * @param {Router} router The router to use
 */
module.exports = router => {
    // Middleware imports
    const renderdataMiddleware = require('./middleware/booru/renderdata.middleware')

    // Controller imports
    const searchController = require('./controllers/booru/search.controller')
    const itemController = require('./controllers/booru/item.controller')
    const collectionsController = require('./controllers/booru/collections.controller')
    const collectionController = require('./controllers/booru/collection.controller')
    const userController = require('./controllers/booru/user.controller')
    const actionController = require('./controllers/booru/action.controller')
    const ajaxTagsController = require('./controllers/booru/tags.controller')
    const ajaxCommentsController = require('./controllers/booru/comments.controller')

    /* Middleware */
    router.use(renderdataMiddleware)

    /* Redirects */
    router.get(prefix, async ctx => await ctx.redirect('/booru/tags'))

    /* Views */
    router.get(prefix+'/tags', async (ctx, next) => {
        await searchController.getSearch(ctx, next)
        await render('search', ctx)
    })
    
    router.get(prefix+'/item/:id', async (ctx, next) => {
        await itemController.getItem(ctx, next)
        await render('item', ctx)
    })

    router.get(prefix+'/user/:username', async (ctx, next) => {
        await userController.getUser(ctx, next)
        await render('user', ctx)
    })

    router.get(prefix+'/collections', async (ctx, next) => {
        await collectionsController.getCollections(ctx, next)
        await render('collections', ctx)
    })

    router.get(prefix+'/collection/:id', async (ctx, next) => {
        await collectionController.getCollection(ctx, next)
        await render('collection', ctx)
    })

    router.get(prefix+'/action', async (ctx, next) => {
        await actionController.getAction(ctx, next)
        await render('action', ctx)
    })
    router.post(prefix+'/action', async (ctx, next) => {
        await actionController.postAction(ctx, next)
        await render('action', ctx)
    })

    /* Ajax */
    router.get(prefix+'/ajax/tags', async (ctx, next) => {
        try {
            await ajaxTagsController.getTags(ctx, next)
        } catch(err) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })

    router.get(prefix+'/ajax/comments', async (ctx, next) => {
        try {
            await ajaxCommentsController.getComments(ctx, next)
        } catch(err) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })

    router.post(prefix+'/ajax/comments/delete', async (ctx, next) => {
        try {
            await ajaxCommentsController.postDeleteComment(ctx, next)
        } catch(err) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })

    router.post(prefix+'/ajax/comments/create', async (ctx, next) => {
        try {
            await ajaxCommentsController.postCreateComment(ctx, next)
        } catch(err) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })
}