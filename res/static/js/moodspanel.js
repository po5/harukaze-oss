function main() {
    var app = new Vue({
        el: '#app',
        data: {
            self: user,

            error: null,
            loading: true,
            chars: []
        },
        methods: {
            handleError(err) {
                console.error('Error occurred:')
                console.error(err)

                this.error = 'Error occurred!'

                if(!(err instanceof Error))
                    this.error += ' API returned error: '+err.error
            },
            async setDefault(char, def) {
                try {
                    this.loading = true

                    let res = await api.post('/api/admin/characters/default/set', {
                        character: char,
                        default: def
                    })

                    if(res.status == 'error') {
                        this.handleError(res)
                        return
                    }

                    this.loadChars()
                    
                    this.loading = false
                } catch(err) {
                    this.handleError(err)
                }
            },
            charById(id) {
                for(char of this.chars)
                    if(char.id == id)
                        return char

                return null
            },

            async loadChars() {
                try {
                    this.loading = true

                    let charsRes = await api.get('/api/admin/characters/list', {})
                    if(charsRes.status == 'error') {
                        this.handleError(charsRes)
                        return
                    }

                    let moodsRes = await api.get('/api/admin/moods/list', {})
                    if(moodsRes.status == 'error') {
                        this.handleError(moodsRes)
                        return
                    }

                    // Enumerate characters and add their moods
                    let chars = []
                    let moods = moodsRes.moods
                    for(char of charsRes.characters) {
                        let arr = []
                        for(mood of moods)
                            if(mood.character == char.id)
                                arr.push(mood)
                        
                        chars.push({
                            ...char,
                            moods: arr
                        })
                    }

                    // Put characeters
                    this.chars = chars
                    this.loading = false
                } catch(err) {
                    this.handleError(err)
                }
            },
            async createCharForm() {
                const createCharName = document.getElementById('create-char-name')
                let name = createCharName.value.trim()

                if(name.length > 0) {
                    this.loading = true
                    createCharName.value = ''

                    // Create char
                    let res = await api.post('/api/admin/characters/create', { name })

                    if(res.status == 'success') {
                        // Success!
                    } else {
                        this.handleError(res)
                    }

                    // Reload characters
                    await this.loadChars()
                }
            },
            async createMoodForm(e) {
                let id = e.target.getAttribute('data-char')*1
                const fileElem = document.getElementById(id+'-mood-file')
                const nameElem = document.getElementById(id+'-mood-name')
                let name = nameElem.value.trim()
                
                if(fileElem.files.length > 0 && name) {
                    let file = fileElem.files[0]
                    
                    this.loading = true

                    // Upload
                    let form = new FormData()
                    form.append('file', file, file.name)
                    form.append('name', name)
                    form.append('character', id)
                    var xhr = new XMLHttpRequest()
                    this.uploadXhr = xhr
                    xhr.onprogress = e => {
                        console.log(e)
                        console.log(`Uploading ${e.loaded}/${e.total}`)
                    }
                    xhr.onreadystatechange = async () => {
                        if(xhr.readyState == 4) {
                            if(xhr.status == 200) {
                                let res = JSON.parse(xhr.responseText)

                                if(res.status == 'success') {
                                    // Load moods
                                    await this.loadChars()

                                    // If character doesn't have a default, set it
                                    let char = this.charById(id)

                                    if(!char.default) {
                                        let mood = char.moods[char.moods.length-1]
                                        await this.setDefault(id, mood.id)
                                    }
                                } else {
                                    this.error = 'Failed to upload! Server returned error: '+res.error
                                }
                            } else {
                                this.error = 'Failed to upload! Server returned status: '+xhr.status
                            }
                        }
                    }
                    xhr.open('POST', '/api/admin/moods/create', true)
                    xhr.send(form)
                }
            },
            async makeDefault(e) {
                let mood = e.target.getAttribute('data-mood')*1
                let char = e.target.getAttribute('data-char')*1
                    
                if(mood && char) {
                    try {
                        await this.setDefault(char, mood)
                    } catch(err) {
                        this.handleError(err)
                    }
                }
            },
            async deleteMood(e) {
                if(confirm('Are you sure you want to delete this mood?\nComments using it will be reset back to a default mood!')) {
                    let id = e.target.getAttribute('data-mood')*1
                        
                    if(id) {
                        try {
                            this.loading = true

                            let res = await api.post('/api/admin/moods/delete', { id })
                            if(res.status == 'error')
                                this.handleError(res)
                            await this.loadChars()

                            this.loading = false
                        } catch(err) {
                            this.handleError(err)
                        }
                    }
                }
            },
            async deleteChar(e) {
                if(confirm('Are you sure you want to delete this character?\nComments using any of its moods will be reset back to a default mood!')) {
                    let id = e.target.getAttribute('data-char')*1
                        
                    if(id) {
                        try {
                            this.loading = true

                            let res = await api.post('/api/admin/characters/delete', { id })
                            if(res.status == 'error') {
                                if(res.error == 'cannot_delete_only_character') {
                                    alert('Cannot delete the only remaining character. Create a new one before deleting this one.')
                                } else {
                                    this.handleError(res)
                                }
                            }
                            await this.loadChars()

                            this.loading = false
                        } catch(err) {
                            this.handleError(err)
                        }
                    }
                }
            }
        }
    })

    app.loadChars()
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