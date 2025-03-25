import { Context } from 'koa'
import Router from 'koa-router'
import { apiRes, apiError } from 'utils/api.util'
import { fetchPostInfoById } from 'models/posts.model'

// Middleware imports
import { renderDataMiddleware } from 'middleware/renderdata.middleware'
import { apiUtilsMiddleware } from 'middleware/api/apiutils.middleware'
import { captchaMiddleware } from 'middleware/captcha.middleware'

// Controller imports
import * as assetsController from 'controllers/assets.controller'
import * as homeController from 'controllers/home.controller'
import * as blogController from 'controllers/blog.controller'
import * as signupController from 'controllers/signup.controller'
import * as loginController from 'controllers/login.controller'
import * as logoutController from 'controllers/logout.controller'
import * as newblogController from 'controllers/newblog.controller'
import * as blogsbyController from 'controllers/blogsby.controller'
import * as editblogController from 'controllers/editblog.controller'
import * as mediamanagerController from 'controllers/mediamanager.controller'
import * as mediaController from 'controllers/media.controller'
import * as myaccountController from 'controllers/myaccount.controller'
import * as contributorController from 'controllers/contributor.controller'
import * as contributorpanelController from 'controllers/contributorpanel.controller'
import * as adminpanelController from 'controllers/adminpanel.controller'
import * as sitesettingsController from 'controllers/sitesettings.controller'
import * as blogtagController from 'controllers/blogtag.controller'
import * as moodspanelController from 'controllers/moodspanel.controller'
import * as logospanelController from 'controllers/logospanel.controller'
import * as blogsearchController from 'controllers/blogsearch.controller'
import * as rssController from 'controllers/rss.controller'
import * as pageController from 'controllers/page.controller'
import * as newpageController from 'controllers/newpage.controller'
import * as editpageController from 'controllers/editpage.controller'
import * as pagespanelController from 'controllers/pagespanel.controller'

// API controller imports
import * as apiMediaController from 'controllers/api/media.controller'
import * as apiPostsController from 'controllers/api/posts.controller'
import * as apiCommentsController from 'controllers/api/comments.controller'
import * as apiBansController from 'controllers/api/bans.controller'
import * as apiUsersController from 'controllers/api/users.controller'
import * as apiMoodsController from 'controllers/api/moods.controller'
import * as apiPagesController from 'controllers/api/pages.controller'
import * as apiSzurubooruController from 'controllers/api/szurubooru.controller'
import { appSzurubooruClient } from 'utils/szurubooru.util'

/**
 * Renders a template with the provided context
 * @param template The name of the template to render
 * @param ctx The context to render with
 */
async function render(template: string, ctx: Context) {
    // Don't do anything if noRender is true
    if(!ctx.state.noRender)
        await ctx.render(template, ctx.state)
}

/**
 * Sets up routes for the application
 * @param router The router to use
 */
export function routes(router: Router) {
    /* Redirects */
    router.get('/home', async ctx => await ctx.redirect('/')) // Looks like / was the true winner after all
    router.get('/home/:page', async ctx => await ctx.redirect('/'+ctx.params.page)) // Looks like / was the true winner after all

    /* Middleware */
    router.use(renderDataMiddleware)
    router.use(apiUtilsMiddleware)
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
    router.get('/assets/mood/:id/:filename', async (ctx, next) => {
        await assetsController.getMood(ctx, next)
    })
    router.get('/assets/logo', async (ctx, next) => {
        await assetsController.getLogo(ctx, next)
    })
    router.get('/assets/logo/:filename', async (ctx, next) => {
        await assetsController.getLogo(ctx, next)
    })

    /* Views */
    router.get('/', async (ctx, next) => {
        await homeController.getHome(ctx, next)
        await render('home', ctx)
    })
    
    router.get('/:page', async (ctx, next) => {
        // Make sure this doesn't block other pages
        if(ctx.params.page !== undefined && isNaN(parseInt(ctx.params.page, 10))) {
            await next()
        } else {
            await homeController.getHome(ctx, next)
            await render('home', ctx)
        }
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

    router.get('/blogs/by/:username', async (ctx, next) => {
        await blogsbyController.getBlogsBy(ctx, next)
        await render('blogsby', ctx)
    })
    router.get('/blogs/by/:username/:page', async (ctx, next) => {
        await blogsbyController.getBlogsBy(ctx, next)
        await render('blogsby', ctx)
    })

    router.get('/blog/:slug/edit', async (ctx, next) => {
        await editblogController.getEditblog(ctx, next)
        await render('editblog', ctx)
    })
    router.post('/blog/:slug/edit', async (ctx, next) => {
        await editblogController.postEditblog(ctx, next)
        await render('editblog', ctx)
    })

    router.get('/blogid/:blogid', async (ctx, next) => {
        const [ post ] = await fetchPostInfoById(true, ctx.params.blogid)
        if(post) {
            ctx.state.noRender = true
            ctx.redirect('/blog/'+post.slug)
        } else {
            // Not found
            ctx.state.noRender = true
            await next()
            return null
        }
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

    router.get('/panel/admin/moods', async (ctx, next) => {
        await moodspanelController.getMoodsPanel(ctx, next)
        await render('moodspanel', ctx)
    })

    router.get('/panel/admin/logos', async (ctx, next) => {
        await logospanelController.getLogosPanel(ctx, next)
        await render('logospanel', ctx)
    })
    router.post('/panel/admin/logos', async (ctx, next) => {
        await logospanelController.postLogosPanel(ctx, next)
        await render('logospanel', ctx)
    })

    router.get('/panel/admin/pages', async (ctx, next) => {
        await pagespanelController.getPagesPanel(ctx, next)
        await render('pagespanel', ctx)
    })

    router.get('/tags/:tag', async (ctx, next) => {
        await blogtagController.getBlogTag(ctx, next)
        await render('blogtag', ctx)
    })
    router.get('/tags/:tag/:page', async (ctx, next) => {
        await blogtagController.getBlogTag(ctx, next)
        await render('blogtag', ctx)
    })

    router.get('/search', async (ctx, next) => {
        await blogsearchController.getBlogSearch(ctx, next)
        await render('blogsearch', ctx)
    })
    router.get('/search/:page', async (ctx, next) => {
        await blogsearchController.getBlogSearch(ctx, next)
        await render('blogsearch', ctx)
    })

    router.get('/rss', async (ctx, next) => {
        await rssController.getRss(ctx, next)
    })

    router.get('/page/:slug', async (ctx, next) => {
        await pageController.getPage(ctx, next)
        await render('page', ctx)
    })

    router.get('/pages/new', async (ctx, next) => {
        await newpageController.getNewpage(ctx, next)
        await render('newpage', ctx)
    })
    router.post('/pages/new', async (ctx, next) => {
        await newpageController.postNewpage(ctx, next)
        await render('newpage', ctx)
    })

    router.get('/page/:slug/edit', async (ctx, next) => {
        await editpageController.getEditpage(ctx, next)
        await render('editpage', ctx)
    })
    router.post('/page/:slug/edit', async (ctx, next) => {
        await editpageController.postEditpage(ctx, next)
        await render('editpage', ctx)
    })

    /* API */
    router.get('/api/media/get', async (ctx, next) => {
        try {
            await apiMediaController.getMedia(ctx, next)
        } catch(err: any) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })
    router.get('/api/media/list', async (ctx, next) => {
        try {
            await apiMediaController.getMediaList(ctx, next)
        } catch(err: any) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })
    router.post('/api/media/upload', async (ctx, next) => {
        try {
            await apiMediaController.postUploadMedia(ctx, next)
        } catch(err: any) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })
    router.post('/api/media/edit', async (ctx, next) => {
        try {
            await apiMediaController.postEditMedia(ctx, next)
        } catch(err: any) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })
    router.post('/api/media/delete', async (ctx, next) => {
        try {
            await apiMediaController.postDeleteMedia(ctx, next)
        } catch(err: any) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })

    router.get('/api/posts/get', async (ctx, next) => {
        try {
            await apiPostsController.getPost(ctx, next)
        } catch(err: any) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })
    router.get('/api/posts/list', async (ctx, next) => {
        try {
            await apiPostsController.getPostsList(ctx, next)
        } catch(err: any) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })
    router.post('/api/posts/delete', async (ctx, next) => {
        try {
            await apiPostsController.postDeletePosts(ctx, next)
        } catch(err: any) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })

    router.get('/api/comments/get', async (ctx, next) => {
        try {
            await apiCommentsController.getComment(ctx, next)
        } catch(err: any) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })
    router.get('/api/comments/list', async (ctx, next) => {
        try {
            await apiCommentsController.getCommentsList(ctx, next)
        } catch(err: any) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })
    router.post('/api/comments/delete', async (ctx, next) => {
        try {
            await apiCommentsController.postDeleteComments(ctx, next)
        } catch(err: any) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })

    router.get('/api/admin/bans/users/list', async (ctx, next) => {
        try {
            await apiBansController.getBannedUsers(ctx, next)
        } catch(err: any) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })
    router.post('/api/admin/bans/users/set', async (ctx, next) => {
        try {
            await apiBansController.postSetUserBan(ctx, next)
        } catch(err: any) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })
    router.get('/api/admin/bans/ips/list', async (ctx, next) => {
        try {
            await apiBansController.getBannedIps(ctx, next)
        } catch(err: any) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })
    router.post('/api/admin/bans/ips/create', async (ctx, next) => {
        try {
            await apiBansController.postCreateIpBan(ctx, next)
        } catch(err: any) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })
    router.post('/api/admin/bans/ips/delete', async (ctx, next) => {
        try {
            await apiBansController.postDeleteIpBan(ctx, next)
        } catch(err: any) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })

    router.get('/api/admin/users/list', async (ctx, next) => {
        try {
            await apiUsersController.getUsers(ctx, next)
        } catch(err: any) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })
    router.post('/api/admin/users/roles/set', async (ctx, next) => {
        try {
            await apiUsersController.postSetRole(ctx, next)
        } catch(err: any) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })

    router.get('/api/admin/characters/list', async (ctx, next) => {
        try {
            await apiMoodsController.getCharacters(ctx, next)
        } catch(err: any) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })
    router.post('/api/admin/characters/default/set', async (ctx, next) => {
        try {
            await apiMoodsController.postSetCharacterDefault(ctx, next)
        } catch(err: any) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })
    router.post('/api/admin/characters/create', async (ctx, next) => {
        try {
            await apiMoodsController.postCreateCharacter(ctx, next)
        } catch(err: any) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })
    router.post('/api/admin/characters/delete', async (ctx, next) => {
        try {
            await apiMoodsController.postDeleteCharacter(ctx, next)
        } catch(err: any) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })

    router.get('/api/admin/moods/list', async (ctx, next) => {
        try {
            await apiMoodsController.getMoods(ctx, next)
        } catch(err: any) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })
    router.post('/api/admin/moods/create', async (ctx, next) => {
        try {
            await apiMoodsController.postCreateMood(ctx, next)
        } catch(err: any) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })
    router.post('/api/admin/moods/delete', async (ctx, next) => {
        try {
            await apiMoodsController.postDeleteMood(ctx, next)
        } catch(err: any) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })

    router.get('/api/pages/get', async (ctx, next) => {
        try {
            await apiPagesController.getPage(ctx, next)
        } catch(err: any) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })
    router.get('/api/pages/list', async (ctx, next) => {
        try {
            await apiPagesController.getPagesList(ctx, next)
        } catch(err: any) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })
    router.post('/api/pages/delete', async (ctx, next) => {
        try {
            await apiPagesController.postDeletePages(ctx, next)
        } catch(err: any) {
            apiError(ctx, err)
        }
        apiRes(ctx)
    })

    if (appSzurubooruClient !== null) {
        router.get('/api/szurubooru/post/:id', async (ctx, next) => {
            try {
                await apiSzurubooruController.getPost(ctx, next)
            } catch(err: any) {
                apiError(ctx, err)
            }
            apiRes(ctx)
        })
    }
}