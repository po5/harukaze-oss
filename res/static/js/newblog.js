// Constants
var contentElem = document.getElementById('content');

// Init SCEditor
sceditor.create(contentElem, {
	format: 'bbcode',
	style: '/static/sceditor/minified/themes/content/default.min.css'
});

// Ask for confirmation before leaving
var leaveCheck = true;
function disableLeaveCheck() { leaveCheck = false; };
window.onbeforeunload = function() {
	return leaveCheck ? 'Are you sure you want to leave? You will lose your progress or edits on this blog if you did not save!' : undefined;
};