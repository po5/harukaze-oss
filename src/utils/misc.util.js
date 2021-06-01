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
        var str = string
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

/* Export functions */
module.exports.stripTrailingSlash = stripTrailingSlash
module.exports.arrayToSet = arrayToSet
module.exports.setToArray = setToArray