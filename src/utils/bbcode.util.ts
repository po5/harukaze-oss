// @ts-ignore
import xbbcode from 'xbbcode-parser'

const urlPattern = /^((?:https?|file|c):(?:\/{1,3}|\\)\/)?[-a-zA-Z0-9:;,@#%&()~_?+=\/\\.]*$/

/**
 * Extracts a URL from bbcode params or content
 * @param params The params string
 * @param content The content string
 * @returns The extracted and processed URL, or '#' if the URL is invalid
 */
function extractBbcodeUrl(params: string | null, content: string): string | '#' {
    let url: string

    // If the URL is not provided in params, use the content as the URL
    if(!params)
        url = content.replace(/<.*?>/g, '')
    else
        url = params.substring(1)

    // If there is no protocol or initial slash, assume 'http://'
    if(!url.startsWith('/') && (!(url.startsWith('http://') || url.startsWith('https://'))))
        url = 'http://'+url

    // Validate URL and replace it with '#' if invalid
    urlPattern.lastIndex = 0
    if(!urlPattern.test(url))
        url = '#'

    return url
}

// Add BBCode tags
xbbcode.addTags({
    size: {
        openTag(params: string, _content: string) {
            let size = 3
            if(/^=[0-9]$/g.test(params))
                size = parseInt(params.substring(1))
            
            return `<font size="${size}">`
        },
        closeTag(_params: string, _content: string) {
            return `</font>`
        }
    },
    center: {
        openTag(_params: string, _content: string) {
            return '<div style="text-align:center">'
        },
        closeTag(_params: string, _content: string) {
            return '</div>'
        }
    },
    rtl: {
        openTag(_params: string, _content: string) {
            return '<div style="text-align:right">'
        },
        closeTag(_params: string, _content: string) {
            return '</div>'
        }
    },
    ltr: {
        openTag(_params: string, _content: string) {
            return '<div style="text-align:left">'
        },
        closeTag(_params: string, _content: string) {
            return '</div>'
        }
    },
    media: {
        openTag(_params: string, _content: string) {
            // TODO Is this something that still needs to be implemented?
        },
        closeTag(_params: string, _content: string) {
            // TODO Is this something that still needs to be implemented?
        }
    },
    h1: {
        openTag(_params: string, _content: string) {
            return `<h1>`
        },
        closeTag(_params: string, _content: string) {
            return `</h1>`
        }
    },
    h2: {
        openTag(_params: string, _content: string) {
            return `<h2>`
        },
        closeTag(_params: string, _content: string) {
            return `</h2>`
        }
    },
    h3: {
        openTag(_params: string, _content: string) {
            return `<h3>`
        },
        closeTag(_params: string, _content: string) {
            return `</h3>`
        }
    },
    hr: {
        openTag(_params: string, _content: string) {
            return '<hr>'
        },
        closeTag(_params: string, _content: string) {
            return ''
        },
        displayContent: false
    },
    youtube: {
        openTag(params: string, content: string) {
            if(content.includes('&'))
                content = content.substring(0, content.indexOf('&'))

            if(content.length == 11)
                content = 'https://www.youtube.com/watch?v='+content

            if(/^https?:\/\/(www\.)?youtu((\.be\/)|(be\.com\/watch\?v=))([a-zA-Z0-9_-]{11})$/g.test(content)) {
                const id = content.substring(content.length-11, content.length).replace(/'/g, '').replace(/"/g, '')

                return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${id}" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
            } else {
                return `<a href="${ encodeURI(content) }" target="_blank">${content}</a> (YouTube)`
            }
        },
        closeTag(_params: string, _content: string) {
            return ''
        },
        displayContent: false
    },
    url: {
        openTag: function(params: string, content: string) {
            const url = extractBbcodeUrl(params, content)

            return '<a href="' + url + '" target="_blank">'
        },
        closeTag: function(_params: string, _content: string) {
            return '</a>'
        }
    },
    video: {
        openTag: function(params: string, content: string) {
            const url = extractBbcodeUrl(params, content)

            return '<video class="xbbcode-video" src="' + url + '" controls>'
        },
        closeTag: function(_params: string, _content: string) {
            return '</video>'
        }
    },
    audio: {
        openTag: function(params: string, content: string) {
            const url = extractBbcodeUrl(params, content)

            return '<audio class="xbbcode-audio" src="' + url + '" controls>'
        },
        closeTag: function(_params: string, _content: string) {
            return '</audio>'
        }
    },
    img: {
        openTag: function(params: string, content: string) {
            if(urlPattern.test(content)) {
                let src = encodeURI(content)
                let linkHtmlStart = ''
                let linkhtmlStop = ''

                // Linkify image if '#link' is on the end of the URL
                if(src.endsWith('#link')) {
                    src = src.substring(0, src.length-5)
                    linkHtmlStart = `<a href="${src}" target="_blank">`
                    linkhtmlStop = `</a>`
                }

                let out = `${linkHtmlStart}<img class="xbbcode-img" `
                if(params && /^=[0-9]+x[0-9]+$/g.test(params)) {
                    const dimensions = params.substring(1).split('x')
                    out += `width="${dimensions[0]}" height="${dimensions[1]}" `
                    src += `?width=${dimensions[0]}&height=${dimensions[1]}`
                } else {
                    src += '?width=900&format=jpg'
                }
                out += `src="${src}" />${linkhtmlStop}`
                return out
            } else {
                return ''
            }
        },
        closeTag: function(_params: string, _content: string) {
            return ''
        },
        displayContent: false
    },
    code: {
        openTag: function(_params: string, _content: string) {
            return '<pre class="xbbcode-code">'
        },
        closeTag: function(_params: string, _content: string) {
            return '</pre>'
        },
        noParse: true
    },
    quote: {
        openTag: function(params: string, content: string) {
            if(params && params.includes('::')) {
                const parts = params.substring(1).split('::')
                let img = parts[0]
                const dir = parts[1] || 'left'
                const color = parts[2] || '#fff'
                const resize = parts[3] || 'resize'

                // If the image param represents a media ID, convert it to the proper URL
                if(!isNaN(parseInt(img, 10)))
                    img = '/assets/media/'+img

                const htmlPerson = (
`<div class="interview-person">
    <img class="interview-image" src="${img}${resize === 'resize' ? '?width=128' : ''}" alt="Interview image">
</div>`)
                const htmlContent = `<div class="interview-content speech-bubble speech-bubble-${dir}" style="border-color:${color};background-color:${color}"><div class="speech-bubble-content">${content}</div></div>`
                
                return (
`<blockquote class="interview interview-${dir} interview-${resize}" data-image="${img}" data-dir="${dir}" data-resize="${resize}">
    ${dir === 'right' ? htmlContent+htmlPerson : htmlPerson+htmlContent}
</blockquote>`)
            } else {
                return `<blockquote class="xbbcode-blockquote">${content}</blockquote>`
            }
        },
        closeTag: function(_params: string, _content: string) {
            return ''
        },
        displayContent: false
    }
})

/**
 * Renders and sanitizes the provided BBCode into HTML
 * @param bbcode The BBCode to render
 * @returns The rendered and sanitized result of the provided BBCode
 */
export function renderBBCode(bbcode: string): string {
    return xbbcode.process({
        text: bbcode.replace(/\[hr]/g, '[hr][/hr]'),
        removeMisalignedTags: false,
        addInLineBreaks: true
    }).html
}