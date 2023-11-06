import { MimeString } from "types/misc.types";

/**
 * Specific media MIME types that cannot be scaled like other normal formats such as PNG
 */
export const UNSCALABLE_MEDIA_MIMES: MimeString[] = [
    'image/gif',
    'image/webp',
    'image/apng',
    'image/avif'
]

/**
 * The maximum user avatar size, in bytes
 */
export const MAX_USER_AVATAR_SIZE = 1024*1024*5

/**
 * The maximum user bio length, in characters
 */
export const MAX_USER_BIO_LENGTH = 2048

/**
 * The maximum limit to use for API pagination
 */
export const MAX_API_PAGINATION_LIMIT = 50

/**
 * The help message displayed on the CLI
 */
export const CLI_HELP_MESSAGE = `
Command line arguments:
--help, -h\t\tShows this message
--create-admin\t\tCreates a new administrator account
--reset-ip-bans\t\tDeletes all IP bans
--probe-media\t\tProbes all media files that do not have metadata already associated with them

Run without any arguments to start the server.
`.trim()