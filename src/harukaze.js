const usersModel = require('./models/users.model')
const ipbansModel = require('./models/ipbans.model')
const moodsModel = require('./models/moods.model')
const moodcharsModel = require('./models/moodchars.model')
const usersUtil = require('./utils/users.util')
const moodsUtil = require('./utils/moods.util')
const logosUtil = require('./utils/logos.util')
const tagsUtil = require('./utils/tags.util')
const utils = require('./utils/misc.util')
const fs = require('fs')
const config = require('../config.json')
const http = require('http')
const https = require('https')
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
const { putEssentialState } = require('./utils/render.util')

// Put root in global object
global.root = path.join(__dirname, '../')

// Whether the server has started
var started = false

/**
 * @param {Array<string>} args 
 */
async function main(args) {
    // Check for special args
    if(args.includes('--help') || args.includes('-h')) {
console.log(`Command line arguments:
--help, -h\t\tShows this message
--create-admin\t\tCreates a new administrator account
--reset-ip-bans\t\tDeletes all IP bans

Run without any arguments to start the server.`)
        process.exit(0)
    } else if(args.includes('--create-admin')) {
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
    } else if(args.includes('--reset-ip-bans')) {
        console.log('Deleting IP bans...')
        await ipbansModel.deleteAllBans()
        console.log('All IP bans have been deleted.')

        process.exit(0)
    }

    // Create required files and directories
    if(!fs.existsSync('media/'))
        fs.mkdirSync('media/')
    if(!fs.existsSync('media/thumbnails/'))
        fs.mkdirSync('media/thumbnails/')
    if(!fs.existsSync('media/avatars'))
        fs.mkdirSync('media/avatars')
    if(!fs.existsSync('media/moods'))
        fs.mkdirSync('media/moods')
    if(!fs.existsSync('media/logos'))
        fs.mkdirSync('media/logos')

    // Check for administrator
    console.log('Connecting to database...')
    let admins = await usersModel.fetchAdminInfos(0, 1)

    if(admins.length < 1)
        console.warn('[!] There are no administrator accounts, run with --create-admin option to create one')
    
    // Create character if there are none
    let chars = await moodcharsModel.fetchCharacterInfos(0, 1, moodcharsModel.Order.CREATED_ASC)
    if(chars.length < 1) {
        // Create new character
        await moodcharsModel.createCharacter('Mr. Default', -1)

        // Reload caches and fetch new character
        moodsUtil.clearCaches()
        let char = (await moodcharsModel.fetchCharacterInfos(0, 1, moodcharsModel.Order.CREATED_ASC))[0]

        // Create moods based on those in the default moods directory
        let files = fs.readdirSync('res/defaults/moods/')
        let keys = []
        for(file of files) {
            let name = file.substring(0, file.lastIndexOf('.'))
            let path = 'res/defaults/moods/'+file
            let key = utils.generateAlphanumericString(10)+'.png'
            keys.push(key)

            // Create mood entry
            await moodsModel.createMood(name, key, char.id, -1)

            // Copy file to assets
            fs.copyFileSync(path, 'media/moods/'+key)
        }

        // Fetch first mood
        let mood = (await moodsModel.fetchMoodInfoByKey(keys[0]))[0]
        // Set character's default mood
        await moodcharsModel.updateCharacterDefaultById(char.id, mood.id)
    }

    // Do initial tag loading
    console.log('Loading tags...')
    await tagsUtil.refreshTags()

    // Put site logo if none are present
    if((await logosUtil.getLogoNames()).length < 1)
        fs.copyFileSync('res/defaults/logos/logo.png', `media/logos/${utils.generateAlphanumericString(10)}.png`)

    // Setup Koa
    const app = new koa()
    app.keys = [config.server.sessionSecret]
    app.proxy = config.server.reverseProxy
    app.proxyIpHeader = config.server.reverseProxyHeader
    const router = new koaRouter()

    koaEjs(app, {
        root: path.normalize(global.root+'/res/views'),
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

    // Error page
    app.use(async (ctx, next) => {
        try {
            await next()
        } catch (err) {
            ctx.status = err.status || 500;

            await putEssentialState(ctx.state)
            ctx.state.error = err
            ctx.state.pageTitle = 'Something went wrong!'
            ctx.state.bbcode = config.site.errorPage
            await ctx.render('error', ctx)

            ctx.app.emit('error', err, ctx);
        }
    })

    // Routes
    require('./routes')(router)
    require('./booruroutes')(router)

    // 404 page
    app.use(async ctx => {
        await putEssentialState(ctx)
        ctx.status = 404
        ctx.state.pageTitle = 'Not found'
        ctx.state.bbcode = config.site.notFoundPage
        await ctx.render('notfound', ctx.state)
    })
    
    // Start server
    let httpsSettings = config.server.https
    let server = httpsSettings.enable ? https.createServer({
        key: fs.readFileSync(httpsSettings.keyPath),
        cert: fs.readFileSync(httpsSettings.certPath)
    }, app.callback()) : http.createServer(app.callback())

    server.listen(config.server.port, config.server.host, null, () => {
        started = true
        console.log(`Listening at ${config.server.host}:${config.server.port}`)
    })

    // Start redirect server if enabled
    if(httpsSettings.enable && httpsSettings.redirectEnable) {
        http.createServer((req, res) => {
            res.statusCode = '301'
            res.statusMessage = 'Found'

            // Work out appropriate host
            let host
            if(req.headers.host) {
                host = req.headers.host

                if(host.includes(':'))
                    host = host.substring(0, host.lastIndexOf(':'))+config.server.port
            } else {
                host = config.server.host+':'+config.server.port
            }
            
            // Redirect to HTTPS version
            res.setHeader('Location', `https://${host}${req.url || ''}`)
            res.end()
        }).listen(httpsSettings.redirectPort, config.server.host)
    }
}

process.on('uncaughtException', error => {
    console.error('UNCAUGHT EXCEPTION: ', error)

    if(!started)
        process.exit(1)
})

main(process.argv.slice(2))