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
 * Sets up routes for the application
 * @param {Router} router The router to use
 */
module.exports = router => {
    // Middleware imports
    const renderdataMiddleware = require('./middleware/renderdata.middleware')
    const authMiddleware = require('./middleware/auth.middleware')

    // Controller imports
    const homeController = require('./controllers/home.controller')
    const blogController = require('./controllers/blog.controller')
    const signupController = require('./controllers/signup.controller')
    const loginController = require('./controllers/login.controller')
    const logoutController = require('./controllers/logout.controller')
    const newblogController = require('./controllers/newblog.controller')
    const editblogController = require('./controllers/editblog.controller')

    // Redirects
    router.get('/', async ctx => await ctx.redirect('/home')) // /? index? that shit is for the birds, man. /home? now that's where it's at. simple, clean, efficient, fast, linux lacks these, which makes it trash

    // Middleware
    router.use(renderdataMiddleware)
    router.use(authMiddleware)

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

    /* API */
    // TODO HAHAHAHAHAHA WOOOOO HAHAHAH HOOOOOOOOOOOOO
    // TODO This is pretty much just like normal routes except no view. Maybe API controllers return JSON?
    // TODO To be determined
}