/**
 * The app's global object
 */
export interface AppGlobal {
	/**
	 * The app's root directory
	 */
	root: string
}

/**
 * A string representing a MIME type
 */
export type MimeString = `${string}/${string}`