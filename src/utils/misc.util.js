const read = require('read')

const alphanumericChars = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

/**
 * Strips the trailing slash from the provided string, if any
 * @param {string} path The path to process
 * @returns {string} The processed path
 */
function stripTrailingSlash(path) {
    return path.endsWith('/') ? path.substring(0, path.length-1) : path
}

/**
 * Returns a sanitized version of the provided path
 * @param {string} path The path to sanitize
 * @returns The sanitized version of the provided path
 */
function sanitizePath(path) {
    let p = path

    while(p.includes('../'))
        p = p.replace('../', '')
    while(p.includes('./'))
        p = p.replace('./', '')
    
    return p
}

/**
 * Processes a string array to be suitable as a MySQL set by making all entries lowercase and removing duplicates and commas
 * @param {Array<string>} stringArray The array of strings to process
 * @returns {string} The MySQL set
 */
function arrayToSet(stringArray) {
    const res = []

    for(let string of stringArray) {
        const str = (string + '')
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
 * @param {string} set The MySQL set to convert
 * @returns {Array<string>} The array from the set
 */
function setToArray(set) {
    let str = set.trim()

    // Check if empty
    if(str.length > 0) {
        // Sanitize and remove duplicates
        let res = []
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
 * @param {string} prompt The prompt to print before the input is accepted
 * @param {boolean} silent Whether to hide typed characters
 * @returns {Promise<string>} The line that was read
 */
function readLine(prompt, silent) {
    return new Promise((res, rej) => {
        read({ prompt, silent: !!silent }, (err, ln) => {
            if(err)
                rej(err)
            else
                res(ln)
        })
    })
}

/**
 * Converts a title to a slug
 * @param {string} title The title to convert
 * @returns {string} The resulting slug
 */
function titleToSlug(title) {
    return title
    .replace(/[ _]/g, '-')
    .replace(/[`~@#$%^&*()+=\\\[\]'";:<>,./?!]/g, '')
    .toLowerCase()
}

/**
 * Returns a psuedo-random between a minimum and maximum
 * @param {number} min The minimum number to return
 * @param {number} max The maximum number to return
 * @returns {number} A random number between a minimum and maximum
 */
 function random(min, max) {
    return Math.floor(Math.random() * (max - min)) + min
}

/**
 * Generates a new random alphanumeric string of the specified length
 * @param {number} length The length of the string to generate
 * @returns {string} A new random alphanumeric string of the specified length
 */
 function generateAlphanumericString(length) {
    let str = ''

    for(let i = 0; i < length; i++)
        str += alphanumericChars[random(0, alphanumericChars.length-1)]

    return str
}

/**
 * Splits a filename into an array containing the base name, and the extension (if present)
 * @param {string} filename The filename to split
 * @returns {Array<string>} An array containing the base name, and the extension (if present)
 */
function splitFilename(filename) {
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
 * @param {string} filename The filename to format
 * @returns {string} The filename formatted as a title
 */
function filenameToTitle(filename) {
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
 * @param {string} str The string to search
 * @returns {Array<number>} All found media IDs
 */
function findMediaIdsInString(str) {
    let matches = str.match(/\/assets\/media\/([0-9]+)/g)

    if(matches) {
        let ids = []
        
        for(let match of matches) {
            let id = match.substring(match.lastIndexOf('/')+1)*1

            if(!isNaN(id) && !ids.includes(id))
                ids.push(id)
        }

        return ids
    } else {
        return []
    }
}

/* Export functions */
module.exports.stripTrailingSlash = stripTrailingSlash
module.exports.sanitizePath = sanitizePath
module.exports.arrayToSet = arrayToSet
module.exports.setToArray = setToArray
module.exports.readLine = readLine
module.exports.titleToSlug = titleToSlug
module.exports.random = random
module.exports.generateAlphanumericString = generateAlphanumericString
module.exports.splitFilename = splitFilename
module.exports.filenameToTitle = filenameToTitle
module.exports.findMediaIdsInString = findMediaIdsInString