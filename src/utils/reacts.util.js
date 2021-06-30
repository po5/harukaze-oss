const config = require('../../config.json').reacts

/**
 * Moods, with each item index corresponding to its mood ID
 */
const Moods = config.moods
/**
 * Characters
 */
const Characters = config.characters

/**
 * Takes in a mood ID and a character name and returns the URL for its image
 * @param {number} mood The mood ID
 * @param {string} character The character
 * @returns {string} The URL for the mood and character image
 */
function characterMoodToUrl(mood, character) {
    return `/static/img/reacts/${character ? character : config.default}/${Moods[moodOrDefault(mood)]}.png`
}

/**
 * Returns the provided mood ID, or default if the ID is invalid
 * @param {number} mood The mood ID
 * @returns {number} The provided mood ID, or default if the ID is invalid
 */
function moodOrDefault(mood) {
    if(isNaN(mood))
        return 0

    let id = Math.max(0, mood)

    if(id >= Moods.length)
        id = 0

    return id
}

/**
 * Returns the provided character, or default if the character is invalid
 * @param {string} character The character
 * @returns {string} The provided character, or default if the character is invalid
 */
function characterOrDefault(character) {
    if(!character)
        return config.default

    let char = character.toLowerCase()

    for(ch of Characters) {
        let c = ch.toLowerCase()
        if(c == char) {
            return c
        }
    }

    return config.default
}

/* Export functions */
module.exports.characterMoodToUrl = characterMoodToUrl
module.exports.moodOrDefault = moodOrDefault
module.exports.characterOrDefault = characterOrDefault

/* Export values */
module.exports.Moods = Moods
module.exports.Characters = Characters