const config = require('../../config.json')
const utils = require('./misc.util')
const captcha = require('trek-captcha')

const keys = {}

/**
 * Returns whether the provided response is valid for the specified captcha token
 * @param {string} token The captcha token
 * @param {string} response The response to validate
 * @returns Whether the provided response is valid
 */
function validateCaptcha(token, response) {
    let val = keys[token]

    // Invalidate regardless of whether it's true or false
    keys[token] = undefined

    return val == response
}

/**
 * Creates a new captcha and returns its token, and base64 encoded image (GIF encoded, prefix with "data:image/gif;base64," in image URL)
 * @returns The newly created captcha's token and base64 encoded image
 */
async function createCaptcha() {
    const res = await captcha()

    // Create token
    let token = utils.generateAlphanumericString(10)
    keys[token] = res.token

    // Expire
    setTimeout(() => keys[token] = undefined, config.site.captchaExpireSeconds*1000)

    // Send token and base64
    return {
        token,
        base64: res.buffer.toString('base64')
    }
}

/* Export functions */
module.exports.validateCaptcha = validateCaptcha
module.exports.createCaptcha = createCaptcha