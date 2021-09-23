function main() {
    const id = location.pathname.substring(location.pathname.lastIndexOf('/')+1)*1

    function arrayToTags(stringArray) {
        let res = []

        for(const string of stringArray) {
            const str = (string+'')
                .trim()
                .toLowerCase()
                .replace(/,/g, '')

            if(!res.includes(str))
                res.push(str)
        }

        return res.join(' ')
    }
    function tagsToArray(set) {
        let str = set.trim()

        // Check if empty
        if(str.length > 0) {
            // Sanitize and remove duplicates
            let res = []
            let split = str.includes(',') ? str.split(',') : str.split(' ')
            for(const element of split) {
                let elem = element
                    .trim()
                    .toLowerCase()

                if(elem.length > 0 && !res.includes(elem))
                    res.push(elem)
            }

            return res
        } else {
            return []
        }
    }

    const app = new Vue({
        el: '#app',
        data: {
            error: null,
            loading: true,
            media: null,
            editing: false,
            ogTitle: null,
            ogTags: null,
            ogBooruVisible: false,
            ogComment: null,
            tagsRaw: '',
            saving: false
        },
        computed: {
            mbSize() {
                return (this.media.size/1000000).toPrecision(3)
            },
            tags() {
                let tags = new Array(this.media.tags.length)

                for(let i = 0; i < this.media.tags.length; i++)
                    tags[i] = this.media.tags[i]
                        .toLowerCase()
                        .replace(/_/g, ' ')

                return tags
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
            async loadMedia() {
                try {
                    this.loading = true
                    this.media = null

                    let res = await api.get('/api/media/get', { id })

                    if(res.status === 'success') {
                        let media = res.media
                        media.booru_visible = media.booru_visible === 1

                        // Put media object
                        this.media = media

                        // Put original values for editable values
                        this.ogTitle = media.title
                        this.ogTags = media.tags
                        this.ogBooruVisible = media.booru_visible
                        this.ogComment = media.comment

                        this.loading = false
                    } else if(res.error === 'not_found') {
                        location.assign('/media')
                    } else {
                        this.handleError(res)
                    }
                } catch(err) {
                    this.handleError(err)
                }
            },
            toggleEditing() {
                if(this.editing) {
                    // Reset to original values
                    this.media.title = this.ogTitle
                    this.media.tags = this.ogTags
                    this.media.booru_visible = this.ogBooruVisible
                    this.media.comment = this.ogComment
                } else {
                    this.tagsRaw = arrayToTags(this.media.tags)

                    // Init tag input
                    setTimeout(() => initTagInput(), 100)
                }

                this.editing = !this.editing
            },
            async save() {
                try {
                    this.loading = true
                    this.media.tags = tagsToArray(this.tagsRaw)

                    // Edit
                    let res = await api.post('/api/media/edit', {
                        id,
                        title: this.media.title,
                        tags: this.media.tags,
                        booru_visible: this.media.booru_visible,
                        comment: this.media.comment || ''
                    })
                    if(res.status === 'success') {
                        this.editing = false
                    } else {
                        this.handleError(res)
                    }

                    this.loading = false
                } catch(err) {
                    this.handleError(err)
                }
            },
            async deleteMedia() {
                if(confirm('Are you sure you want to delete this media file?\nThis CANNOT be undone!')) {
                    try {
                        this.loading = true

                        // Delete
                        let res = await api.post('/api/media/delete', { id })
                        if(res.status == 'success') {
                            location.assign('/media')
                        } else {
                            this.handleError(res)
                        }

                        this.loading = false
                    } catch(err) {
                        this.handleError(err)
                    }
                }
            }
        }
    })

    app.loadMedia()
}

// Load Vue if not present
if(typeof Vue == 'undefined') {
    let script = document.createElement('script')
    script.src = '/static/js/vue.js'
    script.onload = main
    document.body.append(script)
} else {
    main()
}