let gamePageContent = ''

const xhr = new XMLHttpRequest()
xhr.open('GET', 'client/game.html', true)
xhr.onreadystatechange = function() {
    gamePageContent = this.responseText
}
xhr.send()

const loadGamePage = () => {
    const htmlEl = document.body
    htmlEl.innerHTML = gamePageContent
    htmlEl.removeAttribute("class")
}