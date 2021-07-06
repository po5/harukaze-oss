const config = require('../../config.json')
const usersModel = require('../models/users.model')
const { renderBBCode } = require('../utils/bbcode.util')
const { Moods, characterMoodToUrl } = require('../utils/reacts.util')

/**
 * Middleware that fetches data required for rendering pages
 * @param {import("koa").Context} ctx The context
 */
module.exports = async (ctx, next) => {
    // Site data
    ctx.state.site = config.site
    
    // URL
    ctx.state.url = ctx.url

    // Default page title to null
    ctx.state.pageTitle = null

    // Fetch contributors
    ctx.state.contributors = await usersModel.fetchContributorInfos(0, 99)

    // Include BB code util
    ctx.state.renderBBCode = renderBBCode

    // Character moods and util
    ctx.state.characterMoods = Moods
    ctx.state.characterMoodToUrl = characterMoodToUrl

    // Date util
    /**
     * @param {Date} date 
     */
    ctx.state.date = function(date) {
        let now = new Date()
        let tomorrow = new Date()
        tomorrow.setDate(now.getDate()+1)
        let yesterday = new Date()
        yesterday.setDate(now.getDate()-1)
        let day = date.getDate()
        if(day == now.getDate())
            day = 'Today'
        else if(day == tomorrow.getDate())
            day = 'Tomorrow'
        else if(day == yesterday.getDate())
            day = 'Yesterday'
        else
            day = 
                (['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][date.getMonth()])+' '+date.getDate()
        
        if(now.getFullYear() != date.getFullYear())
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

    await next()
}