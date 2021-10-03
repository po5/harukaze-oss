const config = require('../../config.json')
const ejs = require('ejs')
const path = require('path')
const usersModel = require('../models/users.model')
const { renderBBCode } = require('./bbcode.util')
const { Moods, characterMoodToUrl } = require('./moods.util')
const { getLinkShownPages } = require('./pages.util')

async function putEssentialState(ctx, fetchContributors = true) {
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

    // Character moods and util
    ctx.state.characterMoods = Moods
    ctx.state.characterMoodToUrl = characterMoodToUrl

    // Pages to be shown in navigation
    ctx.state.navigationPages = getLinkShownPages()

    // Date util
    /**
     * @param {Date} date 
     */
    ctx.state.date = function(date) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

        let now = new Date()
        let tomorrow = new Date()
        tomorrow.setDate(now.getDate()+1)
        let yesterday = new Date()
        yesterday.setDate(now.getDate()-1)
        let day = date.getDate()
        if(now.getFullYear() === date.getFullYear() && now.getMonth() === date.getMonth()) {
            if(day === now.getDate())
                day = 'Today'
            else if(day === tomorrow.getDate())
                day = 'Tomorrow'
            else if(day === yesterday.getDate())
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
    ctx.state.formatTag = str => str
        .toLowerCase()
        .replace(/_/g, ' ')

    // JSON stringify
    ctx.state.prettyJson = obj => JSON.stringify(obj, null, 4)

    // encodeURIComponent
    ctx.state.encodeURIComponent = encodeURIComponent

    // English pluralization util
    ctx.state.s = sum => sum === 1 ? '' : 's'

    // Datetime-local util
    ctx.state.datetimeLocal = date => date.toISOString().substring(0, 19)

    if(fetchContributors && config.site.showContributors) {
        // Fetch contributors
        ctx.state.contributors = await usersModel.fetchContributorInfos(0, 99)
    }
}

/**
 * Renders an EJS template and returns its content
 * @param {string} template The template name or relative path to render
 * @param {Object} state The state data to provide to the template
 * @returns {Promise<string>} The rendered template
 */
async function renderTemplate(template, state) {
    return await new Promise((res, rej) => {
        ejs.renderFile(path.normalize(global.root+'/res/views/'+template+'.ejs'), state, function(err, str) {
            if(err)
                rej(err)
            else
                res(str)
        })
    })
}

/* Export functions */
module.exports.putEssentialState = putEssentialState
module.exports.renderTemplate = renderTemplate