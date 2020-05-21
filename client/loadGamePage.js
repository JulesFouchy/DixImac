let gamePageContent = ''

const xhr = new XMLHttpRequest()
xhr.open('GET', 'client/game.html', true)
xhr.onreadystatechange = function() {
    if (this.readyState!==4) {
        console.log('this.readyState!==4')
        console.log(this.readyState)
        // setTimeout(loadGamePage, 1000)
        // return
    }
    if (this.status!==200) {
        console.log('this.status!==200')
        // setTimeout(loadGamePage, 1000)
        // return
    }
    gamePageContent = this.responseText
}
xhr.send()

const loadGamePage = () => {
    document.getElementById('global-container').innerHTML = gamePageContent
}