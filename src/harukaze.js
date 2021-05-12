const config = require('../config.json');
const koa = require('koa');
const koaLogger = require('koa-logger');
const koaJson = require('koa-json');
const koaRouter = require('koa-router');
const koaEjs = require('koa-ejs');
const koaStatic = require('koa-static');
const koaMount = require('koa-mount');
const path = require('path');

const app = new koa();
const router = new koaRouter();
koaEjs(app, {
    root: path.join(__dirname, '../res/views'),
    layout: 'layout',
    viewExt: 'ejs',
    cache: false,
    debug: false
});

// Routes
require('./routes.js')(router);

// Koa Middleware
app.use(koaLogger());
app.use(koaJson());
app.use(koaMount('/static', koaStatic(path.join(__dirname, '../res/static'))));
app.use(router.routes()).use(router.allowedMethods());

app.listen(config.server.port);