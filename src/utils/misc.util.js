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
 * Processes a string array to be suitable as a MySQL set by making all entries lowercase and removing duplicates and commas
 * @param {Array<string>} stringArray The array of strings to process
 * @returns {string} The MySQL set
 */
function arrayToSet(stringArray) {
    var res = []

    for(string of stringArray) {
        var str = (string+'')
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
    return set.split(',')
}

/**
 * Reads a line from the terminal
 * @param {string} prompt The prompt to print before the input is accepted
 * @param {boolean} silent Whether to hide typed characters
 * @returns {string} The line that was read
 */
function readLine(prompt, silent) {
    return new Promise((res, rej) => {
        read({ prompt, silent: silent ? true : false }, (err, ln) => {
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
    .replace(/[`~@#\$%\^&\*\(\)+=\\\[\]'";:<>,\./\?!]/g, '')
    .toLowerCase()
}

/**
 * Returns a psuedo-random between a minimum and maximum
 * @param {number} min The minimum number to return
 * @param {number} max The maximum number to return
 * @returns {string} A random number between a minimum and maximum
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
    var str = ''

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
			.replace('_', ' ')
			.replace(/-(?! )/g, ' ')

	// Capitalize first letter
	name = name[0].toUpperCase() + name.substring(1)

	return name.trim()
}

/* Export functions */
module.exports.stripTrailingSlash = stripTrailingSlash
module.exports.arrayToSet = arrayToSet
module.exports.setToArray = setToArray
module.exports.readLine = readLine
module.exports.titleToSlug = titleToSlug
module.exports.random = random
module.exports.generateAlphanumericString = generateAlphanumericString
module.exports.splitFilename = splitFilename
module.exports.filenameToTitle = filenameToTitle