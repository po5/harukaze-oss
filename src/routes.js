// TODO: Make these routes use contained controller functions, and perhaps move data queries to their own files

module.exports = function(router) {
    // Require controllers
    const homeController = require('./controller/home.controller');

    /* Pages */
    router.get('/', async ctx => {
        await homeController.getHome(ctx);
        await ctx.render('index', ctx.state);
    });
    router.get('/:page', async ctx => {
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