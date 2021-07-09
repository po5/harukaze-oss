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
    const captchaMiddleware = require('./middleware/captcha.middleware')

    // Controller imports
    const assetsController = require('./controllers/assets.controller')
    const homeController = require('./controllers/home.controller')
    const blogController = require('./controllers/blog.controller')
    const signupController = require('./controllers/signup.controller')
    const loginController = require('./controllers/login.controller')
    const logoutController = require('./controllers/logout.controller')
    const newblogController = require('./controllers/newblog.controller')
    const editblogController = require('./controllers/editblog.controller')
    const mediamanagerController = require('./controllers/mediamanager.controller')
    const mediaController = require('./controllers/media.controller')
    const myaccountController = require('./controllers/myaccount.controller')
    const contributorController = require('./controllers/contributor.controller')
    const contributorpanelController = require('./controllers/contributorpanel.controller')
    const adminpanelController = require('./controllers/adminpanel.controller')
    const sitesettingsController = require('./controllers/sitesettings.controller')
    const blogtagController = require('./controllers/blogtag.controller')
    const rssController = require('./controllers/rss.controller')

    // API controller imports
    const apiMediaController = require('./controllers/api/media.controller')
    const apiPostsController = require('./controllers/api/posts.controller')
    const apiCommentsController = require('./controllers/api/comments.controller')
    const apiBansController = require('./controllers/api/bans.controller')
    const apiUsersController = require('./controllers/api/users.controller')

    /* Redirects */
    router.get('/', async ctx => await ctx.redirect('/home')) // /? index? that shit is for the birds, man. /home? now that's where it's at. simple, clean, efficient, fast, linux lacks these, which makes it trash

    /* Middleware */
    router.use(renderdataMiddleware)
    router.use(apiutilsMiddleware)
    router.use(captchaMiddleware)

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
    router.get('/assets/avatar/:username', async (ctx, next) => {
        await assetsController.getAvatar(ctx, next)
    })
    router.get('/assets/avatar/:username/:filename', async (ctx, next) => {
        await assetsController.getAvatar(ctx, next)
    })
    router.get('/assets/mood/:id', async (ctx, next) => {
        await assetsController.getMood(ctx, next)
    })
    router.get('/assets/avatar/:id/:filename', async (ctx, next) => {
        await assetsController.getMood(ctx, next)
    })

    /* Views */
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
        await mediamanagerController.getMediaManager(ctx, next)
        await render('mediamanager', ctx)
    })

    router.get('/media/:id', async (ctx, next) => {
        await mediaController.getMedia(ctx, next)
        await render('media', ctx)
    })

    router.get('/myaccount', async (ctx, next) => {
        await myaccountController.getMyAccount(ctx, next)
        await render('myaccount', ctx)
    })
    router.post('/myaccount', async (ctx, next) => {
        await myaccountController.postMyAccount(ctx, next)
        await render('myaccount', ctx)
    })

    router.get('/contributor/:username', async (ctx, next) => {
        await contributorController.getContributor(ctx, next)
        await render('contributor', ctx)
    })

    router.get('/panel', async (ctx, next) => {
        await contributorpanelController.getContributorPanel(ctx, next)
        await render('contributorpanel', ctx)
    })

    router.get('/panel/admin', async (ctx, next) => {
        await adminpanelController.getAdminPanel(ctx, next)
        await render('adminpanel', ctx)
    })

    router.get('/panel/admin/settings', async (ctx, next) => {
        await sitesettingsController.getSiteSettings(ctx, next)
        await render('sitesettings', ctx)
    })
    router.post('/panel/admin/settings', async (ctx, next) => {
        await sitesettingsController.postSiteSettings(ctx, next)
        await render('sitesettings', ctx)
    })

    router.get('/tags/:tag', async (ctx, next) => {
        await blogtagController.getBlogTag(ctx, next)
        await render('blogtag', ctx)
    })
    router.get('/tags/:tag/:page', async (ctx, next) => {
        await blogtagController.getBlogTag(ctx, next)
        await render('blogtag', ctx)
    })

    router.get('/rss', async (ctx, next) => {
        await rssController.getRss(ctx, next)
    })

    /* API */
    router.get('/api/media/get', async (ctx, next) => {
        try {
            await apiMediaController.getMedia(ctx, next)
        } catch(err) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })
    router.get('/api/media/list', async (ctx, next) => {
        try {
            await apiMediaController.getMediaList(ctx, next)
        } catch(err) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })
    router.post('/api/media/upload', async (ctx, next) => {
        try {
            await apiMediaController.postUploadMedia(ctx, next)
        } catch(err) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })
    router.post('/api/media/edit', async (ctx, next) => {
        try {
            await apiMediaController.postEditMedia(ctx, next)
        } catch(err) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })
    router.post('/api/media/delete', async (ctx, next) => {
        try {
            await apiMediaController.postDeleteMedia(ctx, next)
        } catch(err) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })

    router.get('/api/posts/get', async (ctx, next) => {
        try {
            await apiPostsController.getPost(ctx, next)
        } catch(err) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })
    router.get('/api/posts/list', async (ctx, next) => {
        try {
            await apiPostsController.getPostsList(ctx, next)
        } catch(err) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })
    router.post('/api/posts/delete', async (ctx, next) => {
        try {
            await apiPostsController.postDeletePosts(ctx, next)
        } catch(err) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })

    router.get('/api/comments/get', async (ctx, next) => {
        try {
            await apiCommentsController.getComment(ctx, next)
        } catch(err) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })
    router.get('/api/comments/list', async (ctx, next) => {
        try {
            await apiCommentsController.getCommentsList(ctx, next)
        } catch(err) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })
    router.post('/api/comments/delete', async (ctx, next) => {
        try {
            await apiCommentsController.postDeleteComments(ctx, next)
        } catch(err) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })

    router.get('/api/admin/bans/users/list', async (ctx, next) => {
        try {
            await apiBansController.getBannedUsers(ctx, next)
        } catch(err) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })
    router.post('/api/admin/bans/users/set', async (ctx, next) => {
        try {
            await apiBansController.postSetUserBan(ctx, next)
        } catch(err) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })
    router.get('/api/admin/bans/ips/list', async (ctx, next) => {
        try {
            await apiBansController.getBannedIps(ctx, next)
        } catch(err) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })
    router.post('/api/admin/bans/ips/create', async (ctx, next) => {
        try {
            await apiBansController.postCreateIpBan(ctx, next)
        } catch(err) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })
    router.post('/api/admin/bans/ips/delete', async (ctx, next) => {
        try {
            await apiBansController.postDeleteIpBan(ctx, next)
        } catch(err) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })

    router.get('/api/admin/users/list', async (ctx, next) => {
        try {
            await apiUsersController.getUsers(ctx, next)
        } catch(err) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })
    router.post('/api/admin/users/roles/set', async (ctx, next) => {
        try {
            await apiUsersController.postSetRole(ctx, next)
        } catch(err) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })
}