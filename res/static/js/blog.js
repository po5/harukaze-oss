const moodChoosers = document.getElementsByClassName('mood-chooser')
const moodOpeners = document.getElementsByClassName('mood-chooser-open')
const moods = document.getElementsByClassName('mood-chooser-moods')

for(i in moodChoosers) {
    let idx = i
    let chooser = moodChoosers[i]
    console.log(chooser)
    let opener = moodOpeners[i]
    console.log(opener)
    let moodsElem = moods[i]
    console.log(moodsElem.style.display)

    moodsElem.style.display = 'none'
    opener.onclick = function(e) {
        if(moodsElem.style.display == 'block') {
            opener.innerText = 'Moods ⯈'
            moodsElem.style.display = 'none'
        } else {
            opener.innerText = 'Moods ⯆'
            moodsElem.style.display = 'block'
        }
    }
}