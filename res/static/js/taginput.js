function initTagInput() {
    let tagInput = document.getElementById('tag-input')
    
    // Check for element
    if(tagInput) {
        // Create suggestions element
        let boxElem = document.createElement('div')
        boxElem.id = 'tag-input-suggestions'
        boxElem.style.display = 'none'

        // Insert element
        tagInput.after(boxElem)

        function insertTag(tag) {
            // Reconstruct query string by splitting it by spaces, replacing the last element with the full tag, and joining back to spaces
            let parts = tagInput.value.split(' ')
            parts[parts.length-1] = tag
            tagInput.value = parts.join(' ')+' '

            // Hide suggestions
            hideBox()
        }
        function showBox() {
            boxElem.style.display = 'block'
        }
        function hideBox() {
            boxElem.removeAttribute('data-tags')
            boxElem.style.display = 'none'
        }
        async function suggestFor(tag) {
            if(!tag) {
                hideBox()
                return
            }

            // Fetch tags containing provided tag
            let res = await api.get('/booru/ajax/tags', {
                query: tag,
                limit: 10
            })

            if(res.status === 'success') {
                let tags = res.tags
                let tagNames = Object.keys(tags)

                if(tagNames.length > 0) {
                    // Put tags as attribute
                    boxElem.setAttribute('data-tags', tagNames.join(','))

                    // Populate box
                    boxElem.innerHTML = ''
                    for(tag of tagNames) {
                        let elem = document.createElement('div')
                        elem.classList.add('tag-suggestion')
                        elem.style.cursor = 'pointer'
                        elem.setAttribute('data-tag', tag)
                        elem.innerText = tag+' ('+tags[tag]+')'
                        elem.onmousedown = e => {
                            let tag = e.target.getAttribute('data-tag')

                            insertTag(tag)
                        }

                        boxElem.appendChild(elem)
                    }

                    // Show it
                    showBox()
                } else {
                    hideBox()
                }
            } else {
                console.error('Failed to fetch tag suggestions:')
                console.error(res)
            }
        }

        // Hook up events
        tagInput.addEventListener('keydown', e => {
            if(tagInput.selectionStart === tagInput.value.length && (e.key === 'Enter' || e.key === 'Tab')) {
                // Insert suggestion if present
                if(boxElem.getAttribute('data-tags')) {
                    let tags = boxElem.getAttribute('data-tags').split(',')
                    let tag = tags[0]

                    if(tag) {
                        // There is a tag to insert, cancel event
                        e.preventDefault()

                        // Insert tag
                        insertTag(tag)
                    }
                }
                return
            }

            // Perform action 5ms after input to allow for input to be changed
            setTimeout(async () => {
                let str = tagInput.value

                // Suggest tag if cursor is at end of input
                if(tagInput.selectionStart === str.length) {
                    // Get currently typed tag
                    let tag = str.substring(str.lastIndexOf(' ')+1).replace(/,/g, '')

                    await suggestFor(tag)
                }
            }, 5)
        })
        tagInput.addEventListener('blur', () => setTimeout(() => hideBox(), 50))
    }
}

// Load API util if not present
if(typeof api == 'undefined') {
    let script = document.createElement('script')
    script.src = '/static/js/api.js'
    script.onload = initTagInput
    document.body.append(script)
} else {
    initTagInput()
}