const config = require('../../config.json')
const path = require('path')
const fs = require('fs')
const util = require('util')
const writeFile = util.promisify(fs.writeFile)

/**
 * Saves the config file in its current state
 */
async function saveConfig() {
    // Write new config file
    let confPath = path.join(global.root, '/config.json')
    await writeFile(confPath, JSON.stringify(config, null, 4))
}

/* Export functions */
module.exports.saveConfig = saveConfig