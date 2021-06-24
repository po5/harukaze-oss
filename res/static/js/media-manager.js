const api = {
	get: async function(url, json) {
		let resp;
		if(json) {
			let params = '?';
			Object.keys(json).forEach(key => {
				if(params.length > 1) params+='&';
				params+=encodeURIComponent(key)+'='+encodeURIComponent(json[key]);
			})
			resp = await fetch(url+params, {
				credentials: "include",
				method: "GET",
			})
		} else {
			resp = await fetch(url, {
				credentials: "include",
				method: "GET" 
			})
		}
	
		return await resp.json()
	},
	post: async function(url, json) {
		let resp;
		if(json) {
			let params = "";
			Object.keys(json).forEach(key => {
				if(params.length > 1) params+='&';
				params+=encodeURIComponent(key)+'='+encodeURIComponent(json[key]);
			})
			resp = await fetch(url, {
				credentials: "include",
				method: "POST",
				headers: new Headers({
					'Content-Type': 'application/x-www-form-urlencoded'
				}),
				body: params
			})
		} else {
			resp = await fetch(url, {
				credentials: "include",
				method: "POST" 
			})
		}
	
		return await resp.json()
	}
}

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
        uploading: false,
        uploadingFile: null,
        uploadProgress: 0,
        uploadXhr: null
    },
    methods: {
        toggleUploader() {
            this.uploaderVisible = !this.uploaderVisible
        },
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

                let res = await api.get('/api/media', {
                    offset: (this.currentPage-1)*pageSize,
                    limit: pageSize,
                    order: this.order
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
            for(file of this.media)
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

                        if(res.status == 'success')
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
        uploadFile() {
            let files = document.getElementById('file').files

            if(files.length > 0) {
                let file = files[0]
                
                // Upload
                this.uploadingFile = file
                this.uploading = true
                this.uploadProgress = 0
                let form = new FormData()
                form.append('file', file, file.name)
                var xhr = new XMLHttpRequest()
                this.uploadXhr = xhr
                xhr.onprogress = e => {
                    console.log(e)
                    console.log(`Uploading ${e.loaded}/${e.total}`)
                    this.uploadProgress = Math.round((e.loaded/e.total)*100)
                }
                xhr.onreadystatechange = () => {
                    if(xhr.readyState == 4) {
                        if(xhr.status == 200) {
                            let res = JSON.parse(xhr.responseText)

                            if(res.status == 'success')
                                setTimeout(() => this.loadMedia(), 250)
                            else
                                this.error = 'Failed to upload! Server returned error: '+res.error
                        } else {
                            this.error = 'Failed to upload! Server returned status: '+xhr.status
                        }

                        this.uploading = false
                    }
                }
                xhr.open('POST', '/api/media/upload', true)
                xhr.send(form)
            }
        },
        cancelUpload() {
            this.uploadXhr.abort()
            this.uploading = false
        }
    }
})

app.reloadMedia()

// TODO After media upload, go to first page, reset order, etc. so that you can see the latest upload