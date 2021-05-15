// TODO: Make these routes use contained controller functions, and perhaps move data queries to their own files

module.exports = function(router) {
    // Require controllers
    const homeController = require('./controller/home.controller');

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
    })

    router.get('/blog/:slug', async ctx => {
        // Haven't converted this one, but do it like home
        await ctx.render('blog', {contributors: await require('./models/user.model').fetchContributors(), post: await require('./models/post.model').fetchPostBySlug(ctx.params.slug)});
    });

    /* API */
    // TODO HAHAHAHAHAHA WOOOOO HAHAHAH HOOOOOOOOOOOOO
    // TODO This is pretty much just like normal routes except no view. Maybe API controllers return JSON?
    // TODO To be determined
}