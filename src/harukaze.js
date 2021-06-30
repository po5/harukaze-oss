const usersModel = require('./models/users.model')
const usersUtil = require('./utils/users.util')
const utils = require('./utils/misc.util')
const fs = require('fs')

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
const authMiddleware = require('./middleware/auth.middleware')
const protectMiddleware = require('./middleware/protect.middleware')
const path = require('path')

// Whether the server has started
var started = false

/**
 * @param {Array<string>} args 
 */
async function main(args) {
    // Check for special args
    if(args.includes('--create-admin')) {
        console.log('This is the administrator creation wizard. Press CTRL+C to exit at any time.')
        
        let username = null
        
        while(username == null) {
            let name = (await utils.readLine('Username:')).trim()

            // Make sure username is valid
            if(usersUtil.isUsernameValid(name)) {
                // Check for existing user with same name
                let userRes = await usersModel.fetchUserByUsername(name)

                if(userRes.length > 0)
                    console.log('That username is already taken')
                else
                    username = name
            } else {
                console.log('Invalid username')
            }
        }

        // Get password
        let password = await utils.readLine('Password:', true)

        // Confirm password
        let confirm = await utils.readLine('Confirm password:', true)

        if(password == confirm) {
            // Create account
            console.log('Creating account...')
            await usersUtil.createUser(username, null, password, usersUtil.Roles.ADMIN, null)
            console.log(`New administrator account "${username}" created, you may now start the server and log into it.`)
        } else {
            console.log('The passwords do not match')
        }

        process.exit(0)
    }

    // Create required files and directories
    if(!fs.existsSync('media/'))
        fs.mkdirSync('media/')
    if(!fs.existsSync('media/thumbnails/'))
        fs.mkdirSync('media/thumbnails/')
    if(!fs.existsSync('media/avatars'))
        fs.mkdirSync('media/avatars')

    // Check for administrator
    console.log('Connecting to database...')
    let admins = await usersModel.fetchAdminInfos(0, 1)

    if(admins.length < 1)
        console.warn('[!] There are no administrator accounts, run with --create-admin option to create one')

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

    // Middleware
    app.use(koaLogger())
    app.use(koaSession({
        key: 'harukaze-sess',
        renew: true
    }, app))
    app.use(authMiddleware)
    app.use(protectMiddleware([
        [/\/api\/.*/, usersUtil.Roles.CONTRIBUTOR],
        [/\/api\/admin\/.*/, usersUtil.Roles.ADMIN]
    ]))
    app.use(koaJson())
    app.use(koaBody({
        multipart: true,
        formidable: {
            hash: 'sha1',
            keepExtensions: true
        }
    }))
    app.use(koaMount('/static', koaStatic(path.join(__dirname, '../res/static'))))
    app.use(router.routes()).use(router.allowedMethods())

    // Routes
    require('./routes.js')(router)
    
    app.listen(config.server.port, config.server.host, null, () => {
        started = true
        console.log(`Listening at ${config.server.host}:${config.server.port}`)
    })
}

process.on('uncaughtException', error => {
    console.error('UNCAUGHT EXCEPTION: ', error)

    if(!started)
        process.exit(1)
})

main(process.argv.slice(2))