const Router = require('koa-router')

/**
 * Renders a template with the provided context
 * @param {string} template The name of the template to render
 * @param {import('koa').Context} ctx The context to render with
 */
async function render(template, ctx) {
    // Don't do anything if noRender is true
    if(!ctx.state.noRender)
        await ctx.render(template, ctx.state)
}

/**
 * Renders an API response
 * @param {import('koa').Context} ctx The context to render with
 */
function apiRes(ctx) {
    if(!ctx.state.noRender)
        ctx.body = ctx.state.json || { status: 'success' }
}

/**
 * Modifies a context to show an API error
 * @param {import('koa').Context} ctx The context to modify
 * @param {Error} err The error to handle
 */
function apiError(ctx, err) {
    console.error('Error occurred while handling API request:')
    console.error(err)
    ctx.status = 500
    ctx.state.noRender = false
    ctx.state.json = { status: 'internal_error' }
}

/**
 * Sets up routes for the application
 * @param {Router} router The router to use
 */
module.exports = router => {
    // Middleware imports
    const renderdataMiddleware = require('./middleware/renderdata.middleware')
    const apiutilsMiddleware = require('./middleware/api/apiutils.middleware')

    // Controller imports
    const homeController = require('./controllers/home.controller')
    const blogController = require('./controllers/blog.controller')
    const signupController = require('./controllers/signup.controller')
    const loginController = require('./controllers/login.controller')
    const logoutController = require('./controllers/logout.controller')
    const newblogController = require('./controllers/newblog.controller')
    const editblogController = require('./controllers/editblog.controller')
    const mediaController = require('./controllers/media.controller')
    const assetsController = require('./controllers/assets.controller')

    // API controller imports
    const apiMediaController = require('./controllers/api/media.controller')

    // Redirects
    router.get('/', async ctx => await ctx.redirect('/home')) // /? index? that shit is for the birds, man. /home? now that's where it's at. simple, clean, efficient, fast, linux lacks these, which makes it trash

    // Middleware
    router.use(renderdataMiddleware)
    router.use(apiutilsMiddleware)

    /* Assets */
    router.get('/assets/media/:id/:filename', async (ctx, next) => {
        await assetsController.getMedia(ctx, next)
    })
    router.get('/assets/media/:id', async (ctx, next) => {
        await assetsController.getMedia(ctx, next)
    })
    router.get('/assets/thumbnail/:id/:filename', async (ctx, next) => {
        await assetsController.getThumbnail(ctx, next)
    })
    router.get('/assets/thumbnail/:id', async (ctx, next) => {
        await assetsController.getThumbnail(ctx, next)
    })

    // Views
    router.get('/home', async (ctx, next) => {
        await homeController.getHome(ctx, next)
        await render('home', ctx)
    })
    
    router.get('/home/:page', async (ctx, next) => {
        await homeController.getHome(ctx, next)
        await render('home', ctx)
    })

    router.get('/signup', async (ctx, next) => {
        await signupController.getSignup(ctx, next)
        await render('signup', ctx)
    })
    router.post('/signup', async (ctx, next) => {
        await signupController.postSignup(ctx, next)
        await render('signup', ctx)
    })

    router.get('/login', async (ctx, next) => {
        await loginController.getLogin(ctx, next)
        await render('login', ctx)
    })
    router.post('/login', async (ctx, next) => {
        await loginController.postLogin(ctx, next)
        await render('login', ctx)
    })

    router.get('/logout', async (ctx, next) => {
        await logoutController.getLogout(ctx, next)
    })

    router.get('/blogs/new', async (ctx, next) => {
        await newblogController.getNewblog(ctx, next)
        await render('newblog', ctx)
    })
    router.post('/blogs/new', async (ctx, next) => {
        await newblogController.postNewblog(ctx, next)
        await render('newblog', ctx)
    })

    router.get('/blog/:slug/edit', async (ctx, next) => {
        await editblogController.getEditblog(ctx, next)
        await render('editblog', ctx)
    })
    router.post('/blog/:slug/edit', async (ctx, next) => {
        await editblogController.postEditblog(ctx, next)
        await render('editblog', ctx)
    })

    router.get('/blog/:slug', async (ctx, next) => {
        await blogController.getBlog(ctx, next)
        await render('blog', ctx)
    })
    router.post('/blog/:slug', async (ctx, next) => {
        await blogController.postBlog(ctx, next)
        await render('blog', ctx)
    })
    router.get('/blog/:slug/:page', async (ctx, next) => {
        await blogController.getBlog(ctx, next)
        await render('blog', ctx)
    })
    router.post('/blog/:slug/:page', async (ctx, next) => {
        await blogController.postBlog(ctx, next)
        await render('blog', ctx)
    })

    router.get('/media', async (ctx, next) => {
        await mediaController.getMedia(ctx, next)
        await render('media-manager', ctx)
    })

    router.get('/media/:id', async (ctx, next) => {
        await mediaController.getMedia(ctx, next)
        await render('media-manager', ctx)
    })

    /* API */
    router.get('/api/media', async (ctx, next) => {
        try {
            await apiMediaController.getMedia(ctx, next)
        } catch(err) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })
    router.post('/api/media/upload', async (ctx, next) => {
        try {
            await apiMediaController.postUpload(ctx, next)
        } catch(err) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })
    router.post('/api/media/delete', async (ctx, next) => {
        try {
            await apiMediaController.postDelete(ctx, next)
        } catch(err) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })
}