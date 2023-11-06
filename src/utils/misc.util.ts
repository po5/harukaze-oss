import read from 'read'

const alphanumericChars = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

/**
 * Strips the trailing slash from the provided string, if any
 * @param path The path to process
 * @returns The processed path
 */
export function stripTrailingSlash(path: string): string {
    return path.endsWith('/') ? path.substring(0, path.length-1) : path
}

/**
 * Returns a sanitized version of the provided path
 * @param path The path to sanitize
 * @returns The sanitized version of the provided path
 */
export function sanitizePath(path: string): string {
    let p = path

    while(p.includes('../'))
        p = p.replace('../', '')
    while(p.includes('./'))
        p = p.replace('./', '')
    
    return p
}

/**
 * Processes a string array to be suitable as a MySQL set by making all entries lowercase and removing duplicates and commas
 * @param stringArray The array of strings to process
 * @returns The MySQL set
 */
export function arrayToSet(stringArray: string[]): string {
    const res: string[] = []

    for(const string of stringArray) {
        const str = string
            .trim()
            .toLowerCase()
            .replace(/,/g, '')

        if(!res.includes(str))
            res.push(str)
    }

    return res.join(',')
}
/**
 * Converts a MySQL set to an array
 * @param set The MySQL set to convert
 * @returns The array from the set
 */
export function setToArray(set: string): string[] {
    let str = set.trim()

    // Check if empty
    if(str.length > 0) {
        // Sanitize and remove duplicates
        let res: string[] = []
        let split = str.split(',')
        for(let element of split) {
            let elem = element
                .trim()
                .toLowerCase()

            if(elem.length > 0 && !res.includes(elem))
                res.push(elem)
        }

        return res
    } else {
        return []
    }
}

/**
 * Reads a line from the terminal
 * @param prompt The prompt to print before the input is accepted
 * @param silent Whether to hide typed characters
 * @returns The line that was read
 */
export function readLine(prompt: string, silent: boolean = false): Promise<string> {
    return new Promise((res, rej) => {
        read({ prompt, silent: silent }, (err, ln) => {
            if(err)
                rej(err)
            else
                res(ln)
        })
    })
}

/**
 * Converts a title to a slug
 * @param title The title to convert
 * @returns The resulting slug
 */
export function titleToSlug(title: string): string {
    return title
        .replace(/[ _]/g, '-')
        .replace(/[`~@#$%^&*()+=\\\[\]'";:<>,./?!]/g, '')
        .toLowerCase()
}

/**
 * Returns a pseudo-random between a minimum and maximum
 * @param min The minimum number to return
 * @param max The maximum number to return
 * @returns A random number between a minimum and maximum
 */
export function random(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min)) + min
}

/**
 * Generates a new random alphanumeric string of the specified length
 * @param length The length of the string to generate
 * @returns A new random alphanumeric string of the specified length
 */
export function generateAlphanumericString(length: number): string {
    const res = new Array(length)

    for(let i = 0; i < length; i++)
        res[i] = alphanumericChars[random(0, alphanumericChars.length-1)]

    return res.join('')
}

/**
 * Splits a filename into an array containing the base name, and the extension (if present)
 * @param filename The filename to split
 * @returns An array containing the base name, and the extension (if present)
 */
export function splitFilename(filename: string): [string, string?] {
    let index = filename.lastIndexOf('.')
    
    if(index > -1 && index < filename.length-1) {
        let name = filename.substring(0, index)
        let ext = filename.substring(index+1)

        return [name, ext]
    } else {
        return [filename]
    }
}

/**
 * Formats a filename as a title, stripping out extension, trimming, and replacing underscores and dashes with spaces
 * @param filename The filename to format
 * @returns The filename formatted as a title
 */
export function filenameToTitle(filename: string): string {
    let name = filename

	// Cut off extension if present
    let extIndex = filename.lastIndexOf('.')
	if(extIndex > 0)
		name = filename.substring(0, extIndex)

	// Replace underscores and dashes with spaces
	name = name
			.replace(/_/g, ' ')
			.replace(/-(?! )/g, ' ')

	// Capitalize first letter
	name = name[0].toUpperCase() + name.substring(1)

	return name.trim()
}

/**
 * Searches for references to media in the provided string, and returns all found media IDs
 * @param str The string to search
 * @returns All found media IDs
 */
export function findMediaIdsInString(str: string): number[] {
    const matches = str.match(/\/assets\/media\/([0-9]+)/g)

    if(matches) {
        let ids: number[] = []
        
        for(const match of matches) {
            const id = parseInt(match.substring(match.lastIndexOf('/')+1), 10)

            if(!isNaN(id) && !ids.includes(id))
                ids.push(id)
        }

        return ids
    } else {
        return []
    }
}

/**
 * Returns a promise that is resolved in the specified number of milliseconds
 * @param ms The amount of time in milliseconds to sleep
 * @returns The promise
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(res => {
        setTimeout(() => res(), ms)
    })
}

/**
 * Formats a date as an ISO string with its date offset
 * @param date The date to format
 * @returns The formatted date
 */
export function toIsoStringWithOffset(date: Date): string {
    const tzo = -date.getTimezoneOffset()
    const dif = tzo >= 0 ? '+' : '-'
    const pad = (num: number) => (num < 10 ? '0' : '') + num

    return date.getFullYear() +
        '-' + pad(date.getMonth() + 1) +
        '-' + pad(date.getDate()) +
        'T' + pad(date.getHours()) +
        ':' + pad(date.getMinutes()) +
        ':' + pad(date.getSeconds()) +
        dif + pad(Math.floor(Math.abs(tzo) / 60)) +
        ':' + pad(Math.abs(tzo) % 60)
}

/**
 * Returns a Date object based on a datetime-local input field's value and a timezone offset
 * @param dateStr The datetime-local input string
 * @param tzOffsetHours The UTC offset hours
 * @returns The resulting Date object
 */
export function datetimeLocalToDate(dateStr: string, tzOffsetHours: number): Date {
    return new Date(`${dateStr}-${tzOffsetHours < 10 ? '0'+tzOffsetHours : tzOffsetHours}:00`)
}

/**
 * Returns a blank string if the number is 1, otherwise "s".
 * Used for English pluralization.
 * @param num The number
 * @returns A blank string if the number is 1, otherwise "s"
 */
export function englishPlural(num: number): 's' | '' {
    return num === 1 ? '' : 's'
}

/**
 * Pluralizes the provided word if the specified number is not 1, according to English grammar
 * @param word The word to pluralize
 * @param num The number
 * @returns The pluralized or original word, depending on whether the number is 1
 */
export function englishPluralWord(word: string, num: number): `${string}${'s' | ''}` {
    if(num !== 1)
        return word

    if(word.endsWith('y'))
        return word.substring(0, word.length-1)+'ies'
    else if(word.endsWith('Y'))
        return word.substring(0, word.length-1)+'IES'
    else
        return word+'s'
}

/**
 * Returns whether the provided value represents true.
 * If the value is boolean, the value is returned.
 * If the value is a string, it must be one of the following (case-insensitive) values: "true", "yes", "y", "1".
 * If the value is a number, it must be greater than 0.
 * If the value is null or undefined, false will be returned.
 * @param value The value
 * @returns Whether the provided value represents true
 */
export function isTrue(value: boolean | string | number | null | undefined): boolean {
    if(value === null || value === undefined) {
        return false
    } else if(typeof value === 'boolean') {
        return value
    } else if(typeof value === 'string') {
        const lowercase = value.toLowerCase()
        return lowercase === 'true' || lowercase === 'yes' || lowercase === 'y' || lowercase === '1'
    } else {
        return value > 0
    }
}