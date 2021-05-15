/**
 * Strips the trailing slash from the provided string, if any
 * @param {string} path The path to process
 * @returns {string} The processed path
 */
function stripTrailingSlash(path) {
    return path.endsWith('/') ? path.substring(0, path.length-1) : path;
}

/* Export functions */
module.exports.stripTrailingSlash = stripTrailingSlash;