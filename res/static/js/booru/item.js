async function main() {
	const app = new Vue({
		el: '#item-comments-container',
		data: {
			authed,
			user: authed ? user : {},
			defaultMood: authed ? defaultMood : -1,
			moods: authed ? moods : [],
			error: null,
			loading: true,
			posting: false,
			totalComments: 0,
			pages: 1,
			currentPage: 1,
			comments: [],

			mainFormMood: authed ? defaultMood : -1,
			mainFormShowMoods: false,

			formShowMoods: {},
			formShowReply: {},
			formMoods: {},
			formContent: {},

			renderKey: 0
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
				await this.loadComments()
			},
			async lastPage() {
				this.currentPage = Math.max(this.currentPage-1, 0)
				await this.loadComments()
			},
			async loadComments() {
				try {
					this.loading = true

					let res = await api.get('/booru/ajax/comments', {
						id: itemId,
						offset: (this.currentPage-1)*pageSize,
						limit: pageSize,
						order: 1
					})

					if(res.status === 'success') {
						this.totalComments = res.total
						this.pages = Math.max(1, Math.ceil(res.total/pageSize))
						this.comments = res.comments

						this.formShowMoods = {}
						this.formShowReply = {}
						this.formMoods = {}
						this.formContent = {}
						for(let comment of res.comments) {
							this.formShowMoods[comment.id] = false
							this.formShowReply[comment.id] = false
							this.formMoods[comment.id] = this.defaultMood
							this.formContent[comment.id] = ''
						}

						this.loading = false
					} else {
						this.handleError(res)
					}
				} catch(err) {
					this.handleError(err)
				}
			},
			async commentForm(parentId) {
				const content = parentId == null ? this.$refs.mainFormCommentContent.value.trim() : this.formContent[parentId].trim()
				const mood = parentId == null ? this.mainFormMood*1 : this.formMoods[parentId]

				if(content.length < 1)
					return

				this.loading = true

				const res = await api.post('/booru/ajax/comments/create', {
					id: itemId,
					content,
					mood,
					parent: parentId == null ? undefined : parentId
				})

				if(res.status === 'success') {
					if(parentId === null)
						this.currentPage = 1

					await this.loadComments()
				} else {
					this.handleError(res)
				}

				this.loading = false
			},
			async deleteComment(id) {
				this.loading = true

				// Delete user comments
				let res = await api.post('/booru/ajax/comments/delete', { id })

				if(res.status === 'success') {
					// Reload comments
					await this.loadComments()
				} else {
					this.handleError(res)
				}
			},
			date(d) {
				let date = d
				if(typeof d == 'string')
					date = new Date(d)

				const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

				let now = new Date()
				let tomorrow = new Date()
				tomorrow.setDate(now.getDate()+1)
				let yesterday = new Date()
				yesterday.setDate(now.getDate()-1)
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
					day += ', '+date.getFullYear()

				let hour = date.getHours()
				let pm = hour > 12
				if(pm)
					hour -= 12
				let minute = date.getMinutes().toString()
				if(minute.length < 2)
					minute = '0'+minute

				return `${day} at ${hour}:${minute} ${pm ? 'PM' : 'AM'}`
			},
			rerender() {
				this.renderKey = Math.random()
			}
		}
	})

	app.loadComments()
}

// Load required components
async function load() {
	// Load API util
	if(typeof api === 'undefined') {
		await new Promise((res, rej) => {
			let script = document.createElement('script')
			script.src = '/static/js/api.js'
			script.onload = () => res()
			script.onerror = () => rej()
			document.body.append(script)
		})
	}

	// Load Vue
	if(typeof Vue === 'undefined') {
		await new Promise((res, rej) => {
			let script = document.createElement('script')
			script.src = '/static/js/vue.js'
			script.onload = () => res()
			script.onerror = () => rej()
			document.body.append(script)
		})
	}

	await main()
}
load()

// Navigation keyboard events
document.body.addEventListener('keydown', function(e) {
	if(e.key === 'ArrowRight' && typeof nextUrl !== 'undefined')
		location.assign(nextUrl)
	else if(e.key === 'ArrowLeft' && typeof prevUrl !== 'undefined')
		location.assign(prevUrl)
})