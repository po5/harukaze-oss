import { CLI_HELP_MESSAGE } from 'root/constants'
import { readLine } from 'utils/misc.util'
import { createUser, isUsernameValid, UserRoles } from 'utils/users.util'
import { fetchUserByUsername } from 'models/users.model'
import { deleteAllBans } from 'models/ipbans.model'
import { fetchMediaCount, fetchMediaInfoByMimeRegex, updateMediaDimensionsById } from 'models/media.model'
import { probeFileForDimensions } from 'utils/media.util'

/**
 * Handles CLI arguments.
 * This method may invoke process.exit.
 * @param args The application arguments to handle
 */
export async function handleCliArgs(args: string[]) {
    // Check for special args
    if(args.includes('--help') || args.includes('-h')) {
        console.log(CLI_HELP_MESSAGE)
        process.exit(0)
    } else if(args.includes('--create-admin')) {
        console.log('This is the administrator creation wizard. Press CTRL+C to exit at any time.')

        let username: string | null = null

        while(username === null) {
            const name = (await readLine('Username:')).trim()

            // Make sure username is valid
            if(isUsernameValid(name)) {
                // Check for existing user with same name
                const userRes = await fetchUserByUsername(name)

                if(userRes.length > 0)
                    console.log('That username is already taken')
                else
                    username = name
            } else {
                console.log('Invalid username')
            }
        }

        // Get password
        const password = await readLine('Password:', true)

        // Confirm password
        const confirm = await readLine('Confirm password:', true)

        if(password === confirm) {
            // Create account
            console.log('Creating account...')
            await createUser(username, null, password, UserRoles.ADMIN, null, -1)
            console.log(`New administrator account "${username}" created, you may now start the server and log into it.`)
        } else {
            console.log('The passwords do not match')
        }

        process.exit(0)
    } else if(args.includes('--reset-ip-bans')) {
        console.log('Deleting IP bans...')
        await deleteAllBans()
        console.log('All IP bans have been deleted.')

        process.exit(0)
    } else if(args.includes('--probe-media')) {
        console.log('Probing all media for metadata...')
        const total = await fetchMediaCount()
        console.log(`Total media entries: ${total}`)

        // Fetch all media and probe
        let probedCount = 0
        const pageSize = 100
        let offset = 0
        let lastSize = pageSize
        while(lastSize >= pageSize) {
            const files = await fetchMediaInfoByMimeRegex('(image|video)/.*', offset, pageSize, 0)
            lastSize = files.length

            // Probe each file that's missing metadata
            for(const file of files) {
                // Check if height or width are null
                if(file.height === null || file.width === null) {
                    console.log(`Updating metadata for ${file.filename}...`)
                    try {
                        const dimensions = await probeFileForDimensions('media/'+file.key)
                        await updateMediaDimensionsById(file.id, dimensions?.width || null, dimensions?.height || null)
                        probedCount++
                    } catch(err) {
                        console.warn("Failed to probe or update file's metadata:")
                        console.warn(err)
                    }
                }
            }

            offset += pageSize
        }

        console.log(`Set metadata for ${probedCount} file(s)`)

        process.exit(0)
    }
}