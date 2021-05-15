// TODO: Make these routes use contained controller functions, and perhaps move data queries to their own files

module.exports = function(router) {
    // Require controllers
    const homeController = require('./controller/home.controller');
    const blogController = require('./controller/blog.controller');

    /* Redirects */
    router.get('/', async ctx => await ctx.redirect('/home'));

    /* Pages */
    router.get('/home', async ctx => {
        await homeController.getHome(ctx);
        await ctx.render('index', ctx.state);
    });
    router.get('/home/:page', async ctx => {
        await homeController.getHome(ctx);
        await ctx.render('index', ctx.state);
    });

    router.get('/blog/:slug', async ctx => {
        await blogController.getBlog(ctx);
        await ctx.render('blog', ctx.state);
    });

    /* API */
    // TODO HAHAHAHAHAHA WOOOOO HAHAHAH HOOOOOOOOOOOOO
    // TODO This is pretty much just like normal routes except no view. Maybe API controllers return JSON?
    // TODO To be determined
}