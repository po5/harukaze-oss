function main() {
    const pageSize = 20

    var app = new Vue({
        el: '#app',
        data: {
            self: user,

            roles: [
                'Commenter',
                'Contributor',
                'Administrator'
            ],
            error: null,
            userBansLoading: true,
            userBansPages: 1,
            currentUserBansPage: 1,
            userBans: [],
            totalUserBans: 0,

            ipBansLoading: true,
            ipBansPages: 1,
            currentIpBansPage: 1,
            ipBans: [],
            totalIpBans: 0,

            privsLoading: true,
            privsPages: 1,
            currentPrivsPage: 1,
            privs: [],
            totalPrivs: 0
        },
        methods: {
            handleError(err) {
                console.error('Error occurred:')
                console.error(err)

                this.error = 'Error occurred!'

                if(!(err instanceof Error))
                    this.error += ' API returned error: '+err.error
            },

            async nextUserBansPage() {
                this.currentUserBansPage = Math.min(this.currentUserBansPage+1, this.userBansPages)
                await this.loadUserBans()
            },
            async lastUserBansPage() {
                this.currentUserBansPage = Math.max(this.currentUserBansPage-1, 0)
                await this.loadUserBans()
            },
            async loadUserBans() {
                try {
                    this.userBansLoading = true

                    let res = await api.get('/api/admin/bans/users/list', {
                        offset: (this.currentUserBansPage-1)*pageSize,
                        limit: pageSize
                    })

                    if(res.status == 'success') {
                        this.totalUserBans = res.total
                        this.userBansPages = Math.max(1, Math.ceil(res.total/pageSize))
                        this.userBans = res.users
                        this.userBansLoading = false
                    } else {
                        this.handleError(res)
                    }
                } catch(err) {
                    this.handleError(err)
                }
            },
            async banUserForm() {
                const userBanUsername = document.getElementById('user-ban-username')
                let username = userBanUsername.value.trim().toLowerCase()

                if(username.length > 0) {
                    // Make sure not trying to ban self
                    if(user.username.toLowerCase() == username) {
                        alert('You can\'t ban yourself!')
                    } else {
                        this.userBansLoading = true
                        userBanUsername.value = ''

                        // Ban user
                        let res = await api.post('/api/admin/bans/users/set', {
                            username,
                            banned: true
                        })

                        if(res.status == 'success') {
                            // Done!
                        } else if(res.error == 'invalid_user') {
                            alert('That user does not exist')
                        } else {
                            this.handleError(res)
                        }

                        // Reload bans
                        await this.loadUserBans()
                    }
                }
            },
            async unbanUser(username) {
                this.userBansLoading = true

                // Unban user
                let res = await api.post('/api/admin/bans/users/set', {
                    username,
                    banned: false
                })

                if(res.status == 'success') {
                    // Reload bans
                    await this.loadUserBans()
                } else {
                    this.handleError(res)
                }
            },
            async deleteComments(author) {
                if(confirm('Are you sure you want to delete all of this user\'s comments? They cannot be restored!')) {
                    this.userBansLoading = true

                    // Delete user comments
                    let res = await api.post('/api/comments/delete', { author })

                    if(res.status == 'success') {
                        // Reload bans
                        await this.loadUserBans()
                    } else {
                        this.handleError(res)
                    }
                }
            },
            async banUserIps(user) {
                if(
                    confirm(`Are you sure you want to ban all of this user's IPs?
This will block them from making more accounts, but it will also block anyone using any networks the user logged into from creating accounts also.`) &&
                    confirm(`If you logged into this account or used any networks this account used as well, THIS WILL BAN YOU TOO! Do you REALLY want to continue?
In case you lock yourself out, you can run Harukaze with the --reset-ip-bans to reset IP bans.`)
) {
                    this.userBansLoading = true

                    // Ban user IPs
                    let res = await api.post('/api/admin/bans/ips/create', { user })

                    if(res.status == 'success') {
                        // Stop loading indicator, and reload IP bans
                        this.userBansLoading = false
                        await this.loadIpBans()
                    } else {
                        this.handleError(res)
                    }
                }
            },
            async unbanUserIps(user) {
                if(confirm(`Are you sure you want to unban all of this user's IPs?`)) {
                    this.userBansLoading = true

                    // Unban user IPs
                    let res = await api.post('/api/admin/bans/ips/delete', { user })

                    if(res.status == 'success') {
                        // Stop loading indicator, and reload IP bans
                        this.userBansLoading = false
                        await this.loadIpBans()
                    } else {
                        this.handleError(res)
                    }
                }
            },

            async loadIpBans() {
                try {
                    this.ipBansLoading = true

                    let res = await api.get('/api/admin/bans/ips/list', {
                        offset: (this.currentIpBansPage-1)*pageSize,
                        limit: pageSize
                    })

                    if(res.status == 'success') {
                        this.totalIpBans = res.total
                        this.ipBansPages = Math.max(1, Math.ceil(res.total/pageSize))
                        this.ipBans = res.ips
                        this.ipBansLoading = false
                    } else {
                        this.handleError(res)
                    }
                } catch(err) {
                    this.handleError(err)
                }
            },
            async banIpForm() {
                const ipBanIp = document.getElementById('ip-ban-ip')
                let ip = ipBanIp.value.trim().toLowerCase()

                if(ip.length > 0) {
                    this.ipBansLoading = true
                    ipBanIp.value = ''

                    // Ban IP
                    let res = await api.post('/api/admin/bans/ips/create', { ip })

                    if(res.status == 'success') {
                        // Done!
                    } else {
                        this.handleError(res)
                    }

                    // Reload bans
                    await this.loadIpBans()
                }
            },
            async unbanIp(ip) {
                this.ipBansLoading = true

                // Unban IP
                let res = await api.post('/api/admin/bans/ips/delete', { ip })

                if(res.status == 'success') {
                    // Reload bans
                    await this.loadIpBans()
                } else {
                    this.handleError(res)
                }
            },

            async loadPrivs() {
                try {
                    this.privsLoading = true

                    let res = await api.get('/api/admin/users/list', {
                        roles: '1,2',
                        offset: (this.currentPrivsPage-1)*pageSize,
                        limit: pageSize
                    })

                    if(res.status == 'success') {
                        this.totalPrivs = res.total
                        this.privsPages = Math.max(1, Math.ceil(res.total/pageSize))
                        this.privs = res.users
                        this.privsLoading = false
                    } else {
                        this.handleError(res)
                    }
                } catch(err) {
                    this.handleError(err)
                }
            },
            async promoteForm() {
                const promoteUsername = document.getElementById('promote-username')
                let username = promoteUsername.value.trim().toLowerCase()

                if(username == user.username.toLowerCase()) {
                    alert('You are already an administrator!')
                    return
                }

                if(username.length > 0) {
                    promoteUsername.value = ''

                    this.changeUserRole(username, 1)
                }
            },
            async changeUserRole(username, delta) {
                this.privsLoading = true

                // Change user role
                let res = await api.post('/api/admin/users/roles/set', {
                    username,
                    delta
                })

                if(res.status == 'success') {
                    // Done!
                } else {
                    this.handleError(res)
                }

                // Reload users
                await this.loadPrivs()
            },

            date(d) {
                let date = d
                if(typeof d == 'string')
                    date = new Date(d)

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
                } else {
                    day =
                        (['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][date.getMonth()]) + ' ' + date.getDate()
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
        }
    })

    app.loadUserBans()
    app.loadIpBans()
    app.loadPrivs()
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