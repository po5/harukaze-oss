function main() {
    const pageSize = 20

    const app = new Vue({
        el: '#app',
        data: {
            error: null,
            loading: true,
            pages: 1,
            currentPage: 1,
            pageInfos: [],
            totalPages: 0,
            order: 1,
            orders: [
                ['Creation time, ascending', 0],
                ['Creation time, descending', 1],
                ['Title alphabetically, ascending', 2],
                ['Title alphabetically, descending', 3]
            ],
            selected: []
        },
        methods: {
            handleError(err) {
                console.error('Error occurred:')
                console.error(err)

                this.error = 'Error occurred!'

                if(!(err instanceof Error))
                    this.error += ' API returned error: ' + err.error
            },
            async nextPage() {
                this.currentPage = Math.min(this.currentPage + 1, this.pages)
                await this.loadPages()
            },
            async lastPage() {
                this.currentPage = Math.max(this.currentPage - 1, 0)
                await this.loadPages()
            },
            async loadPages() {
                try {
                    this.loading = true
                    this.selected = []

                    let res = await api.get('/api/pages/list', {
                        offset: (this.currentPage - 1) * pageSize,
                        limit: pageSize,
                        order: this.order
                    })

                    if(res.status === 'success') {
                        this.totalPages = res.total
                        this.pages = Math.max(1, Math.ceil(res.total / pageSize))
                        this.pageInfos = res.pages
                        this.loading = false
                    } else {
                        this.handleError(res)
                    }
                } catch(err) {
                    this.handleError(err)
                }
            },
            async reloadPages() {
                this.error = null
                this.pages = 1
                this.currentPage = 1

                await this.loadPages()
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
                for(let page of this.pageInfos)
                    this.selected.push(page.id)
            },
            selectNone() {
                this.selected = []
            },
            async deleteSelected() {
                if(
                    this.selected.length > 0 &&
                    confirm(`Are you sure you want to delete ${this.selected.length} page(s)?\nThis CANNOT be undone!`) &&
                    confirm(`Are you sure you ABSOLUTELY sure?`) // Yup, you get TWO confirms
                ) {
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
                            let res = await api.post('/api/pages/delete', {
                                ids: ids.join(',')
                            })

                            if(res.status === 'success')
                                await this.loadPages()
                            else
                                console.error('Failed to delete pages: ' + res.error)
                        } catch(err) {
                            console.error('Failed to delete pages:')
                            console.error(err)
                            this.error = 'Failed to delete pages'
                        }
                    } catch(err) {
                        this.handleError(err)
                    }
                }
            },
            date(d) {
                let date = d
                if(typeof d == 'string')
                    date = new Date(d)

                const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

                let now = new Date()
                let tomorrow = new Date()
                tomorrow.setDate(now.getDate() + 1)
                let yesterday = new Date()
                yesterday.setDate(now.getDate() - 1)
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
                    day += ', ' + date.getFullYear()

                let hour = date.getHours()
                let pm = hour > 12
                if(pm)
                    hour -= 12
                let minute = date.getMinutes().toString()
                if(minute.length < 2)
                    minute = '0' + minute

                return `${day} at ${hour}:${minute} ${pm ? 'PM' : 'AM'}`
            }
        }
    })

    app.loadPages()
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