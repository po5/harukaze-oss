import config from '../../config.json'
import ejs = require('ejs')
import { Context, DefaultState } from 'koa'
import path from 'path'
import { renderBBCode } from './bbcode.util'
import { getLinkShownPages } from './pages.util'
import { AppGlobal } from 'types/misc.types'
import { fetchContributorInfos } from 'models/users.model'
import { englishPlural, toIsoStringWithOffset } from 'utils/misc.util'

/**
 * Inserts essential state required for controllers and views into a Context object
 * @param ctx The context to insert values into
 * @param fetchContributors Whether to fetch and insert contributors
 */
export async function putEssentialState(ctx: Context, fetchContributors = true) {
    if(!ctx.state)
        ctx.state = {}

    // Site data
    ctx.state.site = config.site
    
    // URL
    ctx.state.url = ctx.url

    // Default page title to null
    ctx.state.pageTitle = null

    // Default meta image to null
    ctx.state.metaImage = null

    // Default meta description to null
    ctx.state.metaDescription = null

    // Include BB code util
    ctx.state.renderBBCode = renderBBCode

    // Pages to be shown in navigation
    ctx.state.navigationPages = getLinkShownPages()

    // Whether the booru is enabled
    ctx.state.enableBooru = config.site.enableBooru

    // Date util
    /**
     * Formats a date
     * @param date The date to format
     */
    ctx.state.date = function(date: Date) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

        let now = new Date()
        let tomorrow = new Date()
        tomorrow.setDate(now.getDate()+1)
        let yesterday = new Date()
        yesterday.setDate(now.getDate()-1)
        const dateNum = date.getDate()
        let day: string
        if(now.getFullYear() === date.getFullYear() && now.getMonth() === date.getMonth()) {
            if(dateNum === now.getDate())
                day = 'Today'
            else if(dateNum === tomorrow.getDate())
                day = 'Tomorrow'
            else if(dateNum === yesterday.getDate())
                day = 'Yesterday'
            else
                day = (months[date.getMonth()]) + ' ' + date.getDate()
        } else {
            day = (months[date.getMonth()]) + ' ' + date.getDate()
        }
        
        if(now.getFullYear() !== date.getFullYear())
            day += ', '+date.getFullYear()
        
        let hour = date.getHours()
        let pm = hour > 12
        if(pm)
            hour -= 12
        let minute = date.getMinutes().toString()
        if(minute.length < 2)
            minute = '0'+minute

        return `${day} at ${hour}:${minute} ${pm ? 'PM' : 'AM'}`
    }
    
    // Tag format
    ctx.state.formatTag = (str: string) => str
        .toLowerCase()
        .replace(/_/g, ' ')

    // JSON stringify
    ctx.state.prettyJson = (obj: any) => JSON.stringify(obj, null, 4)

    // encodeURIComponent
    ctx.state.encodeURIComponent = encodeURIComponent

    // English pluralization util
    ctx.state.s = englishPlural

    // Datetime-local utils
    ctx.state.datetimeLocal = (date: Date) => toIsoStringWithOffset(date).substring(0, 19)
    ctx.state.dateTimezoneOffset = (date: Date) => date.getTimezoneOffset()/60

    if(fetchContributors && config.site.showContributors) {
        // Fetch contributors
        ctx.state.contributors = await fetchContributorInfos(0, 99)
    }
}

/**
 * Renders an EJS template and returns its content
 * @param template The template name or relative path to render
 * @param state The state data to provide to the template
 * @returns The rendered template
 */
export async function renderTemplate(template: string, state: DefaultState): Promise<string> {
    return await new Promise((res, rej) => {
        ejs.renderFile(path.normalize((global as unknown as AppGlobal).root+'/res/views/'+template+'.ejs'), state, function(err, str) {
            if(err)
                rej(err)
            else
                res(str)
        })
    })
}