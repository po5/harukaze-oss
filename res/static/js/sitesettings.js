// Constants
const notFoundElem = document.getElementById('not-found-page')
const errorElem = document.getElementById('error-page')
const szSyncUsersForm = document.getElementById('sz-sync-users-form')

// Init SCEditor instances
let settings = {
	format: 'bbcode',
	style: '/static/sceditor/minified/themes/content/default.min.css',
	toolbar: defaultToolbar
}
sceditor.create(notFoundElem, settings)
sceditor.create(errorElem, settings)

if (szSyncUsersForm) {
	const submitBtn = document.getElementById('sz-sync-users')

	// Reset in case the browser cached the button state
	submitBtn.disabled = false
	submitBtn.value = 'Sync Now'

	szSyncUsersForm.addEventListener('submit', _ => {
		submitBtn.disabled = true
		submitBtn.value = 'Syncing...'
	})
}
