(function () {
    const moodChoosers = document.getElementsByClassName('mood-chooser')
    const moodOpeners = document.getElementsByClassName('mood-chooser-open')
    const moods = document.getElementsByClassName('mood-chooser-moods')

    for (const i in moodChoosers) {
        let idx = i
        let chooser = moodChoosers[i]
        let opener = moodOpeners[i]
        let moodsElem = moods[i]

        if(moodsElem && moodsElem.style) {
            moodsElem.style.display = 'none'
            opener.onclick = function(e) {
                if(moodsElem.style.display === 'block') {
                    opener.innerText = 'Moods ⯈'
                    moodsElem.style.display = 'none'
                } else {
                    opener.innerText = 'Moods ⯆'
                    moodsElem.style.display = 'block'
                }
            }
        }
    }

    const replyBoxes = document.getElementsByClassName('comment-reply-box')
    const boxOpeners = document.getElementsByClassName('comment-reply-open')
    const forms = document.getElementsByClassName('comment-reply-form')

    for (const i in replyBoxes) {
        let idx = i
        let box = replyBoxes[i]
        let opener = boxOpeners[i]
        let formsElem = forms[i]

        if(formsElem && formsElem.style) {
            formsElem.style.display = 'none'
            opener.onclick = function(e) {
                if(formsElem.style.display === 'block') {
                    opener.innerText = 'Reply ⯈'
                    formsElem.style.display = 'none'
                } else {
                    opener.innerText = 'Reply ⯆'
                    formsElem.style.display = 'block'
                }
            }
        }
    }

    /**
     * @param {HTMLElement} container
     */
    function wireUpMoodChooser(container) {
        for (const input of container.getElementsByTagName('input')) {
            if (input.name !== 'moodchar')
                continue;

            const charIdStr = String(input.value);

            input.addEventListener('change', function(_) {
                for (const elem of container.getElementsByClassName('mood-choice')) {
                    const isVisible = elem.dataset.charId === charIdStr;
                    elem.style.display = isVisible ? 'inline-block' : 'none';

                    const elemInput = elem.getElementsByTagName('input')[0];
                    elemInput.checked = isVisible && parseInt(elemInput.dataset.default) === 1;
                }
            });
        }
    }

    for (const container of moodChoosers) {
        wireUpMoodChooser(container);
    }
})();
