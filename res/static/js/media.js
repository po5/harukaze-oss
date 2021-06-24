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

const pageSize = 50

var app = new Vue({
    el: '#app',
    data: {
        error: null,
        uploaderVisible: false,
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
        ]
    },
    methods: {
        toggleUploader() {
            this.uploaderVisible = !this.uploaderVisible
        },
        handleError(err) {
            console.error('Error occurred:')
            console.error(err)
            
            this.error = 'Error occurred!'
        },
        async loadMedia() {
            try {
                this.loading = true

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
        }
    }
})

app.reloadMedia()

// TODO After media upload, go to first page, reset order, etc. so that you can see the latest upload