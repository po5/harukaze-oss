// Navigation keyboard events
document.body.addEventListener('keydown', function(e) {
	if(e.key === 'ArrowRight' && typeof nextUrl !== 'undefined')
		location.assign(nextUrl)
	else if(e.key === 'ArrowLeft' && typeof prevUrl !== 'undefined')
		location.assign(prevUrl)
})
