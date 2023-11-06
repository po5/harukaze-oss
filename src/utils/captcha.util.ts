import config from '../../config.json'
import { generateAlphanumericString } from './misc.util'
// @ts-ignore
import captcha from 'trek-captcha'

/**
 * The current captcha keys
 */
const keys: { [key: string]: string } = {}

/**
 * Returns whether the provided response is valid for the specified captcha token
 * @param token The captcha token
 * @param response The response to validate
 * @returns Whether the provided response is valid
 */
export function validateCaptcha(token: string, response: string): boolean {
    let val = keys[token]

    // Invalidate regardless of whether it's true or false
    delete keys[token]

    return val === response
}

type Base64GifUrl = `data:image/gif;base64,${string}`

/**
 * Creates a new captcha and returns its token, and base64 encoded image (GIF encoded, prefixed with "data:image/gif;base64," in image URL)
 * @returns The newly created captcha's token and base64 encoded image
 */
export async function createCaptcha(): Promise<{ token: string, base64: Base64GifUrl }> {
    const res = await captcha()

    // Create token
    let token = generateAlphanumericString(10)
    keys[token] = res.token

    // Expire
    setTimeout(() => delete keys[token], config.site.captchaExpireSeconds*1000)

    // Send token and base64
    return {
        token,
        base64: (res.buffer as Buffer).toString('base64') as Base64GifUrl
    }
}