// Application config
import config from '../config.json'

// System imports
import { IncomingMessage, ServerResponse } from 'http'
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from 'fs'
import { readdir, unlink } from 'fs/promises'
import * as http from 'http'
import * as https from 'https'

// Koa imports
import koa from 'koa'
import koaLogger from 'koa-logger'
import koaSession from 'koa-session'
import koaJson from 'koa-json'
import koaRouter from 'koa-router'
import koaEjs from 'koa-ejs'
import koaStatic from 'koa-static'
import koaBody from 'koa-body'
import koaMount from 'koa-mount'

// Middleware imports
import { authMiddleware } from 'middleware/auth.middleware'
import { protectMiddleware } from 'middleware/protect.middleware'
import { noCacheMiddleware } from 'middleware/nocache.middleware'

// Route register functions
import { routes } from './routes'
import { booruRoutes } from './booruroutes'

// Misc imports
import * as logging from './utils/logging.util'
import { AppGlobal } from 'types/misc.types'
import { handleCliArgs } from 'root/cli'
import { putEssentialState } from 'utils/render.util'
import path from 'path'

// Model imports
import { fetchAdminInfos } from 'models/users.model'
import { createCharacter, fetchCharacterInfos, MoodCharOrder, updateCharacterDefaultById } from 'models/moodchars.model'
import { clearCaches as clearMoodCaches } from 'utils/moods.util'
import { generateAlphanumericString } from 'utils/misc.util'
import { createMood, fetchMoodInfoByKey } from 'models/moods.model'
import { refreshTags } from 'utils/tags.util'
import { refreshLinkShownPages } from 'utils/pages.util'
import { getLogoNames } from 'utils/logos.util'
import { UserRoles } from 'utils/users.util'

// Put root in global object
(global as unknown as AppGlobal).root = path.join(__dirname, '../')

// Whether the server has started
let started = false

/**
 * Application entry function
 * @param args Application arguments
 */
async function main(args: string[]) {
    await handleCliArgs(args)

    // Setup logging utility if not disabled
    if(!config.server.disableLogs && !args.includes('--disable-logs'))
        await logging.init()

    // Create required files and directories
    if(!existsSync('media/'))
        mkdirSync('media/')
    if(!existsSync('media/thumbnails/'))
        mkdirSync('media/thumbnails/')
    if(!existsSync('media/avatars'))
        mkdirSync('media/avatars')
    if(!existsSync('media/moods'))
        mkdirSync('media/moods')
    if(!existsSync('media/logos'))
        mkdirSync('media/logos')
    if(!existsSync('media/scaled'))
        mkdirSync('media/scaled')

    // Clear cached scaled images every hour
    setInterval(async function() {
        try {
            const scaledImages = await readdir('media/scaled')
            for(const img of scaledImages)
                await unlink('media/scaled/' + img)
        } catch(e) {
            console.error('Failed to delete cached scaled images:')
            console.error(e)
        }
    }, 1000*60*60)

    // Check for administrator
    console.log('Connecting to database...')
    const admins = await fetchAdminInfos(0, 1)

    if(admins.length < 1)
        console.warn('[!] There are no administrator accounts, run with --create-admin option to create one')
    
    // Create character if there are none
    const chars = await fetchCharacterInfos(0, 1, MoodCharOrder.CREATED_ASC)
    if(chars.length < 1) {
        // Create new character
        await createCharacter('Mr. Default', -1)

        // Reload caches and fetch new character
        clearMoodCaches()
        const [ char ] = await fetchCharacterInfos(0, 1, MoodCharOrder.CREATED_ASC)

        // Create moods based on those in the default moods directory
        const files = readdirSync('res/defaults/moods/')
        const keys: string[] = []
        for(const file of files) {
            let name = file.substring(0, file.lastIndexOf('.'))
            let path = 'res/defaults/moods/'+file
            let key = generateAlphanumericString(10)+'.png'
            keys.push(key)

            // Create mood entry
            await createMood(name, key, char.id, -1)

            // Copy file to assets
            copyFileSync(path, 'media/moods/'+key)
        }

        // Fetch first mood
        const [ mood ] = await fetchMoodInfoByKey(keys[0])
        // Set character's default mood
        await updateCharacterDefaultById(char.id, mood?.id)
    }

    // Do initial tag loading
    console.log('Loading tags...')
    await refreshTags()

    // Do initial navigation page loading
    console.log('Loading navigation pages...')
    await refreshLinkShownPages()

    // Put site logo if none are present
    if((await getLogoNames()).length < 1)
        copyFileSync('res/defaults/logos/logo.png', `media/logos/${generateAlphanumericString(10)}.png`)

    // Setup Koa
    const app = new koa()
    app.keys = [ config.server.sessionSecret ]
    app.proxy = config.server.reverseProxy
    app.proxyIpHeader = config.server.reverseProxyHeader
    const router = new koaRouter()

    koaEjs(app, {
        root: path.normalize((global as unknown as AppGlobal).root+'/res/views'),
        layout: 'layout',
        viewExt: 'ejs',
        cache: false,
        debug: false
    })

    // Middleware
    app.use(koaLogger())
    app.use(koaMount('/static', koaStatic(path.join(__dirname, '../res/static'))))
    app.use(koaSession({
        key: 'harukaze-sess',
        renew: true
    }, app))
    app.use(authMiddleware) // Authenticate requests
    app.use(protectMiddleware([ // Apply protection on all API routes
        [/\/api\/.*/, UserRoles.CONTRIBUTOR],
        [/\/api\/admin\/.*/, UserRoles.ADMIN]
    ]))
    app.use(noCacheMiddleware([ // Disable caching on all API routes
        /\/api\/.*/,
        /\/booru\/ajax\/.*/
    ]))
    app.use(koaJson())
    app.use(koaBody({
        multipart: true,
        formidable: {
            hash: 'sha1',
            keepExtensions: true,
            maxFileSize: config.site.maxUploadSize
        }
    }))

    // Register routes
    routes(router)
    if(config.site.enableBooru)
        booruRoutes(router)

    // Error page
    app.use(async (ctx, next) => {
        try {
            await next()
        } catch(err: any) {
            ctx.status = err.status || 500;

            await putEssentialState(ctx.state)
            ctx.state.error = err
            ctx.state.pageTitle = 'Something went wrong!'
            ctx.state.bbcode = config.site.errorPage
            await ctx.render('error', ctx)

            ctx.app.emit('error', err, ctx);
        }
    })

    app.use(router.routes()).use(router.allowedMethods())

    // Not found page
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
        key: readFileSync(httpsSettings.keyPath),
        cert: readFileSync(httpsSettings.certPath)
    }, app.callback()) : http.createServer(app.callback())

    server.listen(config.server.port, config.server.host, undefined, () => {
        started = true
        console.log(`Listening at ${config.server.host}:${config.server.port}`)
    })

    // Start redirect server if enabled
    if(httpsSettings.enable && httpsSettings.redirectEnable) {
        http.createServer((req: IncomingMessage, res: ServerResponse) => {
            res.statusCode = 301
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

// Log unhandled exceptions before exiting
process.on('uncaughtException', error => {
    console.error('UNCAUGHT EXCEPTION: ', error)

    if(!started)
        process.exit(1)
})

// Launch main function
main(process.argv.slice(2)).finally()
