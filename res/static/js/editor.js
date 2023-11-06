/* START UTILS */
function attr(node, attr, value) {
    if (arguments.length < 3) {
        return node.getAttribute(attr);
    }

    // eslint-disable-next-line eqeqeq, no-eq-null
    if (value == null) {
        removeAttr(node, attr);
    } else {
        node.setAttribute(attr, value);
    }
}
function is(node, selector) {
    var result = false;

    if (node && node.nodeType === 1) {
        result = (node.matches || node.msMatchesSelector ||
            node.webkitMatchesSelector).call(node, selector);
    }

    return result;
}
/* END UTILS */

const mediaPickerVue = `
<div id="media-picker">
    <a href="/media" target="_blank">Go to the media manager to upload media</a>
    <br><br>
    <button @click.prevent="loadMedia()">Reload Media</button>
    <br><br>
    <template v-if="typeof linkToOriginal !== 'undefined'">
        <label for="link-media-checkbox" style="display:inline-block;">Link to original image?</label>
        <input v-model="linkToOriginal" type="checkbox" id="link-media-checkbox">
        <br><br>
    </template>
    <p v-if="error" class="form-error">{{ error }}</p>
    <template v-if="loading">
        Loading...
    </template>
    <template v-else>
        <div class="media-nav">
            <span class="page-arrow" @click="lastPage()" v-if="currentPage > 1">&lt;</span>
            <span class="page-number">Page {{ currentPage }} of {{ pages }}</span>
            <span class="page-arrow" @click="nextPage()" v-if="currentPage < pages">&gt;</span>
        </div>
        <div id="media-stats">Total media: {{ totalMedia }}</div>
        <div id="media-container">
            <template v-if="totalMedia > 0">
                <div v-for="file in media" :id="'media-'+file.id" class="media-listing" @click="insertFile(file, linkToOriginal)">
                    <div :class="file.mime.startsWith('video/') ? ['media-thumbnail', 'media-thumbnail-video'] : ['media-thumbnail']">
                        <img v-if="file.thumbnail_key" :src="'/assets/thumbnail/'+file.id" :alt="file.title">
                        <img v-else src="/static/img/media-placeholder.png" :alt="file.title">
                    </div>
                    <div class="media-details">
                        <a :href="'/media/'+file.id" target="_blank">
                            {{ file.title }}
                            <br>
                            ({{ file.filename }})
                        </a>
                        <br>
                        <hr>
                        <a :href="'/media/'+file.id" target="_blank">
                            View/Edit File
                        </a>
                    </div>
                </div>
            </template>
            <template v-else>
                No media files yet. How about you upload one!
            </template>
        </div>
        <div class="media-nav">
            <span class="page-arrow" @click="lastPage()" v-if="currentPage > 1">&lt;</span>
            <span class="page-number">Page {{ currentPage }} of {{ pages }}</span>
            <span class="page-arrow" @click="nextPage()" v-if="currentPage < pages">&gt;</span>
        </div>
    </template>
</div>
`

const defaultToolbar = sceditor.defaultOptions.toolbar+'|media,interview'
const pageSize = 6

sceditor.formats.bbcode.set('video', {
    tags: {
        video: {
            'src': null,
            'controls': null
        }
    },

    allowedChildren: [],
    allowsEmpty: false,
    format: '[video]{0}[/video]',
    html: '<video style="max-width:100%" src="{0}" controls>{0}</video>'
})
sceditor.formats.bbcode.set('audio', {
    tags: {
        audio: {
            'src': null,
            'controls': null
        }
    },

    allowedChildren: [],
    allowsEmpty: false,
    format: '[audio]{0}[/audio]',
    html: '<audio src="{0}" controls>{0}</audio>'
})
sceditor.formats.bbcode.set('audio', {
    tags: {
        audio: {
            'src': null,
            'controls': null
        }
    },

    allowedChildren: [],
    allowsEmpty: false,
    format: '[audio]{0}[/audio]',
    html: '<audio src="{0}" controls>{0}</audio>'
})
sceditor.formats.bbcode.set('quote', {
    tags: {
        blockquote: null
    },
    isInline: false,
    format: function (element, content) {
        if(attr(element, 'data-image')) {
            let img = attr(element, 'data-image') || ''
            let dir = attr(element, 'data-dir') || 'left'
            let color = attr(element, 'data-color') || '#e6e6e6'
            let resize = attr(element, 'data-resize') || 'resize'

            let pattern = dir == 'right' ?
                /\W*\[img(=.*)?\].*\[\/img\]\W*(\[\/right\])?\W*$/ :
                /^\W*(\[left\])?\W*\[img(=.*)?\].*\[\/img\]\W*/
            
            let txt = content.replace(pattern, '').trim()
            while(txt.startsWith('[left]') || txt.endsWith('[/left') || txt.endsWith('[/left]') || txt.startsWith('[right]') || txt.endsWith('[/right]')) {
                if(txt.startsWith('[left]'))
                    txt = txt.substring(6).trim()
                if(txt.endsWith('[/left]'))
                    txt = txt.substring(0, txt.length-7).trim()
                if(txt.endsWith('[/left'))
                    txt = txt.substring(0, txt.length-6).trim()
                if(txt.startsWith('[right]'))
                    txt = txt.substring(7).trim()
                if(txt.endsWith('[/right]'))
                    txt = txt.substring(0, txt.length-8).trim()
                    
                txt = txt.trim()
            }

            if(txt.indexOf(']') < txt.indexOf('['))
                txt = '['+txt

            return `[quote=${img}::${dir}::${color}::${resize}]${txt}[/quote]`
        } else {
            var authorAttr = 'data-author'
            var	author = ''
            var cite
            var children = element.children

            for(var i = 0; !cite && i < children.length; i++) {
                if (is(children[i], 'cite')) {
                    cite = children[i]
                }
            }

            if(cite || attr(element, authorAttr)) {
                author = cite && cite.textContent ||
                    attr(element, authorAttr)

                attr(element, authorAttr, author)

                if (cite) {
                    element.removeChild(cite)
                }

                content	= this.elementToBbcode(element)
                author  = '=' + author.replace(/(^\s+|\s+$)/g, '')

                if (cite) {
                    element.insertBefore(cite, element.firstChild)
                }
            }

            return '[quote' + author + ']' + content + '[/quote]'
        }
    },
    html: function (token, attrs, content) {
        if(attrs.defaultattr && attrs.defaultattr.includes('::')) {
            let parts = attrs.defaultattr.split('::')
            let img = parts[0]
            let dir = parts[1] || 'left'
            let color = parts[2] || '#fff'
            let resize = parts[3] || 'resize'

            if(!isNaN(img))
                img = '/assets/media/'+img

            let htmlPerson = (
`<div class="interview-person">
    <img class="interview-image" src="${img}">
</div>`)
            let htmlContent = (
`<div class="interview-content speech-bubble speech-bubble-${dir}" style="border-color:${color};background-color:${color}">
    <div class="speech-bubble-content">
        ${content}
    </div>
</div>`)
            
            return (
`<blockquote class="interview interview-${dir} interview-${resize}" data-image="${img}" data-dir="${dir}" data-color="${color}" data-resize="${resize}">
    ${dir == 'right' ? htmlContent+htmlPerson : htmlPerson+htmlContent}
</blockquote>`)
        } else {
            if(attrs.defaultattr) {
                content = '<cite>' + attrs.defaultattr +
                    '</cite>' + content;
            }

            return '<blockquote>' + content + '</blockquote>';
        }
    }
})

sceditor.command.set('media', {
    exec: function(caller) {
        var editor = this

        let html = mediaPickerVue

        let elem = document.createElement('div')
        elem.innerHTML = html
        this.createDropDown(caller, 'mediapicker', elem)

        let app = new Vue({
            el: '#media-picker',
            data: {
                error: null,
                loading: true,
                pages: 1,
                currentPage: 1,
                media: [],
                totalMedia: 0,
                linkToOriginal: true
            },
            methods: {
                handleError(err) {
                    console.error('Error occurred:')
                    console.error(err)
        
                    this.error = 'Error occurred!'
        
                    if(!(err instanceof Error))
                        this.error += ' API returned error: '+err.error
                },
                async nextPage() {
                    this.currentPage = Math.min(this.currentPage+1, this.pages)
                    await this.loadMedia()
                },
                async lastPage() {
                    this.currentPage = Math.max(this.currentPage-1, 0)
                    await this.loadMedia()
                },
                async loadMedia() {
                    try {
                        this.loading = true
                        this.media = []
        
                        let res = await api.get('/api/media/list', {
                            offset: (this.currentPage-1)*pageSize,
                            limit: pageSize,
                            order: 1
                        })
    
                        if(res.status === 'success') {
                            this.totalMedia = res.total
                            this.pages = Math.max(1, Math.ceil(res.total/pageSize))
                            this.media = res.media
                            this.loading = false
                        } else {
                            this.handleError(res)
                        }
                    } catch(err) {
                        this.handleError(err)
                    }
                },
                async insertFile(file, linkToOriginal) {
                    let close = true

                    if(file.mime.startsWith('image/')) {
                        editor.insert(`[img]/assets/media/${file.id}${linkToOriginal ? '#link' : ''}[/img]`)
                    } else if(file.mime.startsWith('video/')) {
                        editor.insert(`[video]/assets/media/${file.id}[/video]`)
                    } else if(file.mime.startsWith('audio/')) {
                        editor.insert(`[audio]/assets/media/${file.id}[/audio]`)
                    } else {
                        close = false
                        alert('Cannot insert media of type '+mime)
                    }

                    if(close)
                        editor.closeDropDown()
                }
            }
        })
        
        app.loadMedia()
    },
    tooltip: 'Insert media'
})

sceditor.command.set('interview', {
	exec: function(caller) {
		var editor = this

        let html = `
        <div id="interview-insert">
            <template v-if="selecting">
                <h3>Choose character image</h3>
                ${mediaPickerVue}
            </template>
            <template v-else>
                <button @click.prevent="selecting = true">&lt;-- Back to chooser</button>
                <br><br>
                <img height="128" :src="selected">
                <br><br>
                Align:
                <select v-model="dir">
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                </select>
                <br><br>
                Bubble color:
                <input type="color" v-model="color">
                <br><br>
                Resize character:
                <select v-model="resizeSelect">
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                </select>
                <br><br>
                <button @click.prevent="insert()">Insert</button>
            </template>
        </div>
        `

        let elem = document.createElement('div')
        elem.innerHTML = html
        this.createDropDown(caller, 'mediapicker', elem)

        let app = new Vue({
            el: '#interview-insert',
            data: {
                error: null,
                loading: true,
                pages: 1,
                currentPage: 1,
                media: [],
                totalMedia: 0,
                selecting: true,
                selected: null,
                dir: 'left',
                color: '#e6e6e6',
                resize: true,
                linkToOriginal: false
            },
            computed: {
                resizeSelect: {
                    get() {
                        return this.resize.toString()
                    },
                    set(val) {
                        let v = val.toLowerCase()
                        this.resize = v === 'yes' || v === 'true'
                    }
                }
            },
            methods: {
                handleError(err) {
                    console.error('Error occurred:')
                    console.error(err)
        
                    this.error = 'Error occurred!'
        
                    if(!(err instanceof Error))
                        this.error += ' API returned error: '+err.error
                },
                async nextPage() {
                    this.currentPage = Math.min(this.currentPage+1, this.pages)
                    await this.loadMedia()
                },
                async lastPage() {
                    this.currentPage = Math.max(this.currentPage-1, 0)
                    await this.loadMedia()
                },
                async loadMedia() {
                    try {
                        this.loading = true
                        this.media = []
        
                        let res = await api.get('/api/media/list', {
                            offset: (this.currentPage-1)*pageSize,
                            limit: pageSize,
                            order: 1
                        })
    
                        if(res.status == 'success') {
                            this.totalMedia = res.total
                            this.pages = Math.max(1, Math.ceil(res.total/pageSize))
                            this.media = res.media
                            this.loading = false
                        } else {
                            this.handleError(res)
                        }
                    } catch(err) {
                        this.handleError(err)
                    }
                },
                async insertFile(file) {
                    if(file.mime.startsWith('image/')) {
                        this.selected = '/assets/media/'+file.id
                        this.selecting = false
                    } else {
                        alert('Cannot insert media of type '+file.mime)
                    }
                },
                insert() {
                    editor.insert(`\n[quote=${this.selected}::${this.dir}::${this.color}::${this.resize ? 'resize' : 'noresize'}]Edit me[/quote]\n`)
                    editor.closeDropDown()
                }
            }
        })
        
        app.loadMedia()
	},
	tooltip: 'Insert Interview'
})

// Load Vue if not present
if(typeof Vue == 'undefined') {
    let script = document.createElement('script')
    script.src = '/static/js/vue.js'
    script.type = 'text/javascript'
    document.body.append(script)
}

// Load API util if not present
if(typeof api == 'undefined') {
    let script = document.createElement('script')
    script.src = '/static/js/api.js'
    script.type = 'text/javascript'
    document.body.append(script)
}