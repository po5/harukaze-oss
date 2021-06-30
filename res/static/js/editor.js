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

sceditor.command.set('media', {
    exec: function(caller) {
        var editor = this

        let html = `
        <div id="media-picker">
            <a href="/media" target="_blank">Go to the media manager to upload media</a>
            <br><br>
            <button @click.prevent="loadMedia()">Reload Media</button>
            <br><br>
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
                        <div v-for="file in media" :id="'media-'+file.id" class="media-listing" @click="insert(file)">
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
                async insert(file) {
                    if(file.mime.startsWith('image/')) {
                        editor.insert(`[img]/assets/media/${file.id}[/img]`)
                    } else if(file.mime.startsWith('video/')) {
                        editor.insert(`[video]/assets/media/${file.id}[/video]`)
                    } else if(file.mime.startsWith('audio/')) {
                        editor.insert(`[audio]/assets/media/${file.id}[/audio]`)
                    } else {
                        alert('Cannot insert media of type '+mime)
                    }
                }
            }
        })
        
        app.loadMedia()
    },
    tooltip: 'Insert media'
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