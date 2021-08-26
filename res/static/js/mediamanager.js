function main() {
    const pageSize = 36

    var app = new Vue({
        el: '#app',
        data: {
            error: null,
            loading: true,
            pages: 1,
            currentPage: 1,
            media: [],
            totalMedia: 0,
            order: 1,
            orders: [
                ['Upload time, ascending', 0],
                ['Upload time, descending', 1],
                ['Title alphabetically, ascending', 2],
                ['Title alphabetically, descending', 3],
                ['Filename alphabetically, ascending', 4],
                ['Filename alphabetically, descending', 5],
                ['Size, ascending', 6],
                ['Size, descending', 7]
            ],
            selected: [],
            uploads: [],
            uplKey: 0
        },
        methods: {
            handleError(err) {
                console.error('Error occurred:')
                console.error(err)
                
                this.loading = false
                this.error = 'Error occurred!'
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
                    this.selected = []

                    let res = await api.get('/api/media/list', {
                        offset: (this.currentPage-1)*pageSize,
                        limit: pageSize,
                        order: this.order
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
            async reloadMedia() {
                this.error = null
                this.pages = 1
                this.currentPage = 1
                    
                await this.loadMedia()
            },
            toggleSelect(id) {
                let index = this.selected.indexOf(id)
                if(index > -1)
                    this.selected.splice(index, 1)
                else
                    this.selected.push(id)
            },
            selectAll() {
                this.selected = []
                for(let file of this.media)
                    this.selected.push(file.id)
            },
            selectNone() {
                this.selected = []
            },
            async deleteSelected() {
                if(this.selected.length > 0 && confirm(`Are you sure you want to delete ${this.selected.length} file(s)?\nThis CANNOT be undone!`)) {
                    try {
                        this.loading = true

                        // Copy IDs
                        let ids = []
                        for(id of this.selected)
                            ids.push(id)
                        
                        // Clear selected to avoid double delete calls
                        this.selected = []

                        // Delete
                        try {
                            let res = await api.post('/api/media/delete', {
                                ids: ids.join(',')
                            })

                            if(res.status === 'success')
                                this.loadMedia()
                            else
                                console.error('Failed to delete media: '+res.error)
                        } catch(err) {
                            console.error('Failed to delete media:')
                            console.error(err)
                            this.error = 'Failed to delete media'
                        }
                    } catch(err) {
                        this.handleError(err)
                    }
                }
            },
            async uploadFile() {
                const uplElem = document.getElementById('file')

                // Copy files into array and clear selected files from element
                const rawFiles = uplElem.files
                let files = new Array(rawFiles.length)
                for(let i in rawFiles)
                    files[i] = rawFiles[i]
                uplElem.value = null

                for(let file of files) {
                    const uplId = Math.random()
                    const uplObj = {
                        id: uplId,
                        file,
                        progress: 0,
                        cancelToken: axios.CancelToken.source(),
                        error: null
                    }

                    // Upload
                    let form = new FormData()
                    form.append('file', file, file.name)
                    this.uploads.push(uplObj)

                    const vm = this

                    function remove() {
                        for(let i in vm.uploads) {
                            if(vm.uploads[i].id === uplId) {
                                vm.uploads.splice(i, 1)
                                break
                            }
                        }
                    }
                    function error(msg) {
                        vm.uplKey = Math.random()
                        uplObj.error = msg
                    }

                    // Check size
                    if(file.size > maxUploadSize) {
                        error(`File "${file.name}" exceeds the max upload size`)
                        return
                    }

                    // Upload file
                    axios.post(
                        '/api/media/upload',
                        form,
                        {
                            cancelToken: uplObj.cancelToken.token,
                            onUploadProgress(e) {
                                uplObj.progress = Math.round((e.loaded / e.total) * 100)
                            }
                        }
                    ).then(response => {
                        const res = response.data
                        if(res.status === 'success') {
                            if(res.existing) {
                                error('This file already exists')
                            } else {
                                remove()
                                setTimeout(() => this.loadMedia(), 250)
                            }
                        } else {
                            this.uplKey = Math.random()
                            uplObj.error = 'Failed to upload! Server returned error: ' + res.error
                        }
                    }).catch(e => {
                        console.error('Failed to upload:')
                        console.error(e)
                        error('Failed to upload! Server returned status: '+e)
                    })
                }
            },
            cancelUpload(id) {
                let upl = null

                for(let i in this.uploads) {
                    const upload = this.uploads[i]
                    if(upload.id === id) {
                        upl = upload
                        this.uploads.splice(i, 1)
                        break
                    }
                }

                if(upl)
                    upl.cancelToken.cancel()
            }
        }
    })

    app.reloadMedia()
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