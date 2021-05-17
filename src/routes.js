module.exports = router => {
    // Controller imports
    const homeController = require('./controller/home.controller');
    const blogController = require('./controller/blog.controller');

    // Redirects
    router.get('/', async ctx => await ctx.redirect('/home')); // /? index? that shit is for the birds, man. /home? now that's where it's at. simple, clean, efficient, fast, linux lacks these, which makes it trash.

    // Views
    router.get('/home', async ctx => {
        await homeController.getHome(ctx);
        await ctx.render('home', ctx.state);
    });
    
    router.get('/home/:page', async ctx => {
        await homeController.getHome(ctx);
        await ctx.render('home', ctx.state);
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