const config = require('../../config.json')
const xbbcode = require('xbbcode-parser')

const urlPattern = /^((?:https?|file|c):(?:\/{1,3}|\\{1})\/)?[-a-zA-Z0-9:;,@#%&()~_?\+=\/\\\.]*$/

// Add BBCode tags
xbbcode.addTags({
    size: {
        openTag(params, content) {
            let size = 3
            if(/^=[0-9]$/g.test(params))
                size = params.substring(1)*1
            
            return `<font size="${size}">`
        },
        closeTag(params, content) {
            return `</font>`
        }
    },
    center: {
        openTag(params, content) {
            return '<div style="text-align:center">'
        },
        closeTag(params, content) {
            return '</div>'
        }
    },
    rtl: {
        openTag(params, content) {
            return '<div style="text-align:right">'
        },
        closeTag(params, content) {
            return '</div>'
        }
    },
    ltr: {
        openTag(params, content) {
            return '<div style="text-align:left">'
        },
        closeTag(params, content) {
            return '</div>'
        }
    },
    media: {
        openTag(params, content) {
            // TODO
        },
        closeTag(params, content) {
            // TODO
        }
    },
    h1: {
        openTag(params, content) {
            return `<h1>`
        },
        closeTag(params, content) {
            return `</h1>`
        }
    },
    h2: {
        openTag(params, content) {
            return `<h2>`
        },
        closeTag(params, content) {
            return `</h2>`
        }
    },
    h3: {
        openTag(params, content) {
            return `<h3>`
        },
        closeTag(params, content) {
            return `</h3>`
        }
    },
    youtube: {
        openTag(params, content) {
            if(content.includes('&'))
                content = content.substring(0, content.indexOf('&'))

            if(content.length == 11)
                content = 'https://www.youtube.com/watch?v='+content

            if(/^https?:\/\/(www\.)?youtu((\.be\/)|(be\.com\/watch\?v=))([a-zA-Z0-9_-]{11})$/g.test(content)) {
                var id = content.substring(content.length-11, content.length).replace(/'/g, '').replace(/"/g, '')

                return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${id}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
            } else {
                return `<a href="${ encodeURI(content) }" target="_blank">${content}</a> (YouTube)`
            }
        },
        closeTag(params, content) {
            return ''
        },
        displayContent: false
    },
    url: {
        openTag: function(params, content) {
            var url

            if (!params) {
                url = content.replace(/<.*?>/g, "")
            } else {
                url = params.substr(1)
            }

            if(!url.startsWith('/') && (!(url.startsWith('http://') || url.startsWith('https://'))))
                url = 'http://'+url

            urlPattern.lastIndex = 0
            if(!urlPattern.test(url))
                url = "#";

            return '<a href="' + url + '" target="_blank">';
        },
        closeTag: function(params, content) {
            return '</a>';
        }
    },
    video: {
        openTag: function(params, content) {
            var url

            if (!params) {
                url = content.replace(/<.*?>/g, "")
            } else {
                url = params.substr(1)
            }

            if(!url.startsWith('/') && (!(url.startsWith('http://') || url.startsWith('https://'))))
                url = 'http://'+url

            urlPattern.lastIndex = 0
            if(!urlPattern.test(url))
                url = "#";

            return '<video class="xbbcode-video" src="' + url + '" controls>';
        },
        closeTag: function(params, content) {
            return '</video>';
        }
    },
    audio: {
        openTag: function(params, content) {
            var url

            if (!params) {
                url = content.replace(/<.*?>/g, "")
            } else {
                url = params.substr(1)
            }

            if(!url.startsWith('/') && (!(url.startsWith('http://') || url.startsWith('https://'))))
                url = 'http://'+url

            urlPattern.lastIndex = 0
            if(!urlPattern.test(url))
                url = "#";

            return '<audio class="xbbcode-audio" src="' + url + '" controls>';
        },
        closeTag: function(params, content) {
            return '</audio>';
        }
    },
    img: {
        openTag: function(params, content) {
            if(urlPattern.test(content)) {
                var out = '<img class="xbbcode-img" '
                if(params && /^=[0-9]+x[0-9]+$/g.test(params)) {
                    var dimensions = params.substring(1).split('x')
                    out += `width="${dimensions[0]}" height="${dimensions[1]}" `
                }
                out += `src="${content}" />`
                return out
            } else {
                return ''
            }
        },
        closeTag: function(params, content) {
            return ''
        },
        displayContent: false
    },
    quote: {
        openTag: function(params, content) {
            var out = ''
            if(params && /^=[A-Za-z0-9\-\_]+(@[0-9]+(:[0-9]+)?)?$/g.test(params)) {
                var parts = params.substring(1).split('@')
                var author = parts[0]
                var post = parts[1]
                if(post) {
                    out += `<span class="xbbcode-blockquote-author"><a href="${config.siteRoot}/forums/thread/${ post }">${ author } said</a></span>`
                } else {
                    out += `<span class="xbbcode-blockquote-author">${ author } said</span>`
                }
            }
            out += '<blockquote class="xbbcode-blockquote">'
            return out
        },
        closeTag: function(params, content) {
            return '</blockquote>'
        }
    },
    code: {
        openTag: function(params, content) {
            return '<pre class="xbbcode-code">'
        },
        closeTag: function(params, content) {
            return '</pre>'
        },
        noParse: true
    },
    quote: {
        openTag: function(params, content) {
            if(params && params.includes('::')) {
                let parts = params.substring(1).split('::')
                let img = parts[0]
                let dir = parts[1]
                let color = parts[2]

                if(!isNaN(img))
                    img = '/assets/media/'+img

                let htmlPerson = (
`<div class="interview-person">
    <img class="interview-image" src="${img}">
</div>`)
                let htmlContent = `<div class="interview-content speech-bubble speech-bubble-${dir}" style="border-color:${color};background-color:${color}"><div class="speech-bubble-content">${content}</div></div>`
                
                return (
`<blockquote class="interview interview-${dir}" data-image="${img}" data-dir="${dir}">
    ${dir == 'right' ? htmlContent+htmlPerson : htmlPerson+htmlContent}
</blockquote>`)
            } else {
                return `<blockquote class="xbbcode-blockquote">${content}</blockquote>`
            }
        },
        closeTag: function(params, content) {
            return ''
        },
        displayContent: false
    }
})

/**
 * Renders and sanitizes the provided BBCode into HTML
 * @param {string} bbcode The BBCode to render
 * @returns The rendered and sanitized result of the provided BBCode
 */
function renderBBCode(bbcode) {
    return xbbcode.process({
        text: bbcode,
        removeMisalignedTags: false,
        addInLineBreaks: true
    }).html
}

/* Export functions */
module.exports.renderBBCode = renderBBCode