// Constants
const contentElem = document.getElementById('content')

// Init SCEditor
sceditor.create(contentElem, {
	format: 'bbcode',
	style: '/static/sceditor/minified/themes/content/default.min.css',
	toolbar: defaultToolbar
})

// Ask for confirmation before leaving
let leaveCheck = true;
function disableLeaveCheck() { leaveCheck = false; };
window.onbeforeunload = function() {
	return leaveCheck ? 'Are you sure you want to leave? You will lose your progress or edits on this blog if you did not save!' : undefined
}

// Handle publish time input
const publishDateToggle = document.getElementById('opt-publish-date-toggle')
const publishDateInput = document.getElementById('publish-date-input')

if(publishDate !== null) {
	publishDateInput.name = 'publishdate'
	publishDateInput.style.display = 'block'
}

publishDateToggle.onchange = function(e) {
	const checked = publishDateToggle.checked

	if(checked) {
		publishDateInput.name = 'publishdate'
		publishDateInput.style.display = 'block'
	} else {
		publishDateInput.name = 'publishdate-disabled'
		publishDateInput.style.display = 'none'
	}
}