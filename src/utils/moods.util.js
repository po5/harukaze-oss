const config = require('../../config.json')

/**
 * Moods, with each item index corresponding to its mood ID
 */
const Moods = [
    'default',
    'cheer',
    'horny',
    'mad',
    'omg',
    'sad',
    'scare',
    'yay',
    'yuck'
]

/**
 * Takes in a mood ID and a character name and returns the URL for its image
 * @param {number} mood The mood ID
 * @param {string} character The character
 * @returns {string} The URL for the mood and character image
 */
function characterMoodToUrl(mood, character) {
    return `/static/img/reacts/${character ? character : config.site.defaultCharacter}/${Moods[mood]}.png`
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

/* Export functions */
module.exports.characterMoodToUrl = characterMoodToUrl
module.exports.moodOrDefault = moodOrDefault

/* Export values */
module.exports.Moods = Moods