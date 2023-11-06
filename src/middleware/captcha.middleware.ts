import { Context, Next } from 'koa'
import { createCaptcha, validateCaptcha } from 'utils/captcha.util'

/**
 * Middleware that creates captcha-related utility functions for controllers and views
 * @param ctx The context
 * @param next The next function
 */
export async function captchaMiddleware(ctx: Context, next: Next) {
    // Controller utils
    ctx.createCaptcha = async function() {
        // Generate captcha
        const captcha = await createCaptcha()

        // Put context data
        ctx.state.captchaToken = captcha.token
        ctx.state.captchaBase64 = captcha.base64
    }
    ctx.validateCaptcha = function() {
        let body = ctx.method === 'POST' ? ctx.request.body : ctx.request.query

        if(body['captcha-token'] && body['captcha-response'])
            return validateCaptcha(body['captcha-token'], body['captcha-response'])
        else
            return false
    }

    // View utils
    ctx.state.captchaInput = () => `<input type="hidden" name="captcha-token" value="${ctx.state.captchaToken}">`
    ctx.state.captchaImage = () => `<img src="data:image/gif;base64,${ctx.state.captchaBase64}" class="captcha-image" alt="Captcha image">`

    await next()
}