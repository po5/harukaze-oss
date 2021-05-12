// TODO: Make these routes use contained controller functions, and perhaps move data queries to their own files

module.exports = function(router) {
    /* Pages */
    router.get('/', async ctx => {
        await ctx.render('index', {contributors: await require('./models/user.model').fetchContributors(), posts: await require('./models/post.model').fetchPosts()});
    });

    router.get('/blog/:slug', async ctx => {
        await ctx.render('blog', {contributors: await require('./models/user.model').fetchContributors(), post: await require('./models/post.model').fetchPostBySlug(ctx.params.slug)});
    });

    /* API */
}