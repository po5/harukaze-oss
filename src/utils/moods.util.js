const moodsModel = require('../models/moods.model')
const moodcharsModel = require('../models/moodchars.model')

var _charsCache = []
var _moodsCache = []

async function _refreshCharsCache() {
    _charsCache = await moodcharsModel.fetchCharacterInfosWithDefault(0, Number.MAX_SAFE_INTEGER, moodcharsModel.Order.CREATED_ASC)
}
async function _refreshMoodsCache() {
    _moodsCache = await moodsModel.fetchMoodInfos(0, Number.MAX_SAFE_INTEGER, moodsModel.Order.CREATED_ASC)
}

/**
 * Clears all mood-related caches
 */
function clearCaches() {
    _charsCache = []
    _moodsCache = []
}

/**
 * Returns all usable characters
 * @returns {Array<Object>} All usable characters
 */
async function getUsableCharacters() {
    if(_charsCache.length < 1)
        await _refreshCharsCache()
    
    return _charsCache
}

/**
 * Returns the character with the specified ID or null if it doesn't exist
 * @param {number} id The ID
 * @returns {Object} The character with the specified ID or null if it doesn't exist
 */
async function getCharacterById(id) {
    if(_charsCache.length < 1)
        await _refreshCharsCache()
    
    for(char of _charsCache)
        if(char.id == id)
            return char
    
    return null
}

/**
 * Returns all moods
 * @returns {Array<Object>} All moods
 */
async function getMoods() {
    if(_moodsCache.length < 1)
        await _refreshMoodsCache()
    
    return _moodsCache
}

/**
 * Returns all moods with the specified character
 * @param {number} character The character ID
 * @returns 
 */
async function getMoodsByCharacter(character) {
    if(_moodsCache.length < 1)
        await _refreshMoodsCache()
    
    let moods = []
    for(mood of _moodsCache)
        if(mood.character == character)
            moods.push(mood)
    
    return moods
}

/**
 * Returns the mood with the specified ID or null if it doesn't exist
 * @param {number} id The ID
 * @returns {Object} The mood with the specified ID or null if it doesn't exist
 */
async function getMoodById(id) {
    if(_moodsCache.length < 1)
        await _refreshMoodsCache()

    for(mood of _moodsCache)
        if(mood.id == id)
            return mood

    return null
}

/* Export functions */
module.exports.clearCaches = clearCaches
module.exports.getUsableCharacters = getUsableCharacters
module.exports.getCharacterById = getCharacterById
module.exports.getMoods = getMoods
module.exports.getMoodsByCharacter = getMoodsByCharacter
module.exports.getMoodById = getMoodById