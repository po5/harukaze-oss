const Router = require('koa-router')

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

    // Redirects
    router.get('/', async ctx => await ctx.redirect('/home')) // /? index? that shit is for the birds, man. /home? now that's where it's at. simple, clean, efficient, fast, linux lacks these, which makes it trash

    // Middleware
    router.use(renderdataMiddleware)
    router.use(authMiddleware)

    // Views
    router.get('/home', async ctx => {
        await homeController.getHome(ctx)
        await ctx.render('home', ctx.state)
    })
    
    router.get('/home/:page', async ctx => {
        await homeController.getHome(ctx)
        await ctx.render('home', ctx.state)
    })

    router.get('/blog/:slug', async ctx => {
        await blogController.getBlog(ctx)
        await ctx.render('blog', ctx.state)
    })

    router.get('/signup', async ctx => {
        await signupController.getSignup(ctx)
        await ctx.render('signup', ctx.state)
    })
    router.post('/signup', async ctx => {
        await signupController.postSignup(ctx)
        await ctx.render('signup', ctx.state)
    })

    router.get('/login', async ctx => {
        await loginController.getLogin(ctx)
        await ctx.render('login', ctx.state)
    })
    router.post('/login', async ctx => {
        await loginController.postLogin(ctx)
        await ctx.render('login', ctx.state)
    })

    router.get('/logout', async ctx => {
        await logoutController.getLogout(ctx)
    })

    /* API */
    // TODO HAHAHAHAHAHA WOOOOO HAHAHAH HOOOOOOOOOOOOO
    // TODO This is pretty much just like normal routes except no view. Maybe API controllers return JSON?
    // TODO To be determined
}