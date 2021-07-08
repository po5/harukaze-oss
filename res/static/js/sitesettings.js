// Constants
const notFoundElem = document.getElementById('not-found-page')
const errorElem = document.getElementById('error-page')

// Init SCEditor instances
let settings = {
	format: 'bbcode',
	style: '/static/sceditor/minified/themes/content/default.min.css',
	toolbar: defaultToolbar
}
sceditor.create(notFoundElem, settings)
sceditor.create(errorElem, settings)