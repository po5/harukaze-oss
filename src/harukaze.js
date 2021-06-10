const knexConfig = require('../knexfile')
const knex = require('knex')(knexConfig)

const config = require('../config.json')
const koa = require('koa')
const koaLogger = require('koa-logger')
const koaSession = require('koa-session')
const koaJson = require('koa-json')
const koaRouter = require('koa-router')
const koaEjs = require('koa-ejs')
const koaStatic = require('koa-static')
const koaBody = require('koa-body')
const koaMount = require('koa-mount')
const path = require('path')

async function main() {
    
    // Test database connection
    console.log('Connecting to database...')
    await knex.select(0)

    // Setup Koa
    const app = new koa()
    app.keys = [config.server.sessionSecret]
    app.proxy = config.server.reverseProxy
    app.proxyIpHeader = config.server.reverseProxyHeader
    const router = new koaRouter()

    koaEjs(app, {
        root: path.join(__dirname, '../res/views'),
        layout: 'layout',
        viewExt: 'ejs',
        cache: false,
        debug: false
    })
    
    // Routes
    require('./routes.js')(router)
    
    // Koa Middleware
    app.use(koaLogger())
    app.use(koaSession({
        key: 'harukaze-sess',
        renew: true
    }, app))
    app.use(koaJson())
    app.use(koaBody())
    app.use(koaMount('/static', koaStatic(path.join(__dirname, '../res/static'))))
    app.use(router.routes()).use(router.allowedMethods())
    
    app.listen(config.server.port, config.server.host)
    console.log(`Listening at ${config.server.host}:${config.server.port}`)
}

main()