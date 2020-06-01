let gamePageContent = ''

const xhr = new XMLHttpRequest()
xhr.open('GET', 'client/game.html', true)
xhr.onreadystatechange = function() {
    gamePageContent = this.responseText
}
xhr.send()

const loadGamePage = () => {
    const htmlEl = document.getElementById('landingPage')
    htmlEl.innerHTML = gamePageContent
    htmlEl.removeAttribute("class")
}