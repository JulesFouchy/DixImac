const drawNameInput = () => {
    const htmlEl = document.getElementById('pseudo-input')
    htmlEl.value = myName
}

const drawRoomInfo = () => {
    const htmlEl = document.getElementById('roomInfo')
    htmlEl.innerHTML = 'You are in room <b>' + myRoomID + '</b>'
}

const drawCardList = (html, list, onClick, selectedCardIndex) => {
    html.innerHTML = ''
    for (let i = 0; i < list.length; ++i) {
        html.innerHTML += '<span><img src = ' + renderCard(list[i])
            + (selectedCardIndex === i ? ' class = \" selectedImage cardImg\"' : ' class = cardImg')
            + ' onclick = "' + onClick + '( ' + i + ')\"'
            + '></img></span>';
    }
}

const drawHand = () => drawCardList(document.getElementById("yourHand"), myHand, "onCardInHandClick", mySelectedCardInHandIndex)

const drawCardsAtPlay = () => drawCardList(document.getElementById("cardsAtPlay"), myCardsAtPlay, "onCardAtPlayClick", mySelectedCardAtPlayIndex)

const getSpanOfCardVoters = (cardAtPLayIndex) => {
    const list = myVoteResults[cardAtPLayIndex]
    let res = '<span class = "cardVoters">'
    for (let i = 0; i < list.length; ++i) {
        res += '<span class = "cardVoter" style = "color : ' + list[i].color + '">' + list[i].name + '</span>'
    }
    res += '</span>'
    return res
}

const drawCardsAtPlayAndVotesResult = () => {
    const html = document.getElementById("cardsAtPlay")
    const list = myCardsAtPlayAndTheirPlayers
    html.innerHTML = ''
    for (let i = 0; i < list.length; ++i) {
        html.innerHTML = html.innerHTML
            + '<span class = cardAndVotesResult>'
            + '<span class = "cardOwner" style = "color : ' + list[i].playerColor + '">' + list[i].playerName + '</span>'
            + '<img src = ' + renderCard(list[i].card)
            + (mySelectedCardAtPlayIndex === i ? ' class = \" selectedImage cardImg\"' : ' class = cardImg')
            + (i === myGameMastersCardIndex ? ' id = gameMastersCard' : '')
            + '></img>'
            + getSpanOfCardVoters(i)
            + "</span>";
    }
}

const drawCardsAtPlayHidden = () => {
    const html = document.getElementById("cardsAtPlay")
    html.innerHTML = ''
    for (let i = 0; i < getNbCardsAtPlay(); ++i) {
        html.innerHTML += '<div class="cardVerso"></div>'
    }
}

const drawStateMessage = () => {
    let message
    switch (myGamePhase) {
        case GAME_MASTER_PICKING_A_CARD:
            message = ((myGameMasterID === myPlayerID) ? '<div class="alert alert-warning" role="alert">You are the Story Teller, pick a card and write an hint</div>' : "Waiting for the Story Teller to pick a card")
            break
        case OTHER_PLAYERS_PICKING_A_CARD:
            message = ((myGameMasterID !== myPlayerID) ? '<div class="alert alert-warning" role="alert">Pick a card that would match the hint</div>' : "Waiting for other players to pick a card")
            break
        case VOTING_FOR_A_CARD:
            message = ((myGameMasterID !== myPlayerID) ? '<div class="alert alert-warning" role="alert">Vote for a card</div>' : 'Waiting for the other players to vote for a card')
            break
        case VIEWING_VOTES:
            message = ''
            break
        default:
            break
    }
    const htmlStateMessage = document.getElementById("stateMessage")
    htmlStateMessage.innerHTML = '<p class="' + (bYouHaveToPlay() ? 'youHaveToPlay' : 'youHaveToWait') + '">' + message + '</p>'
}

const drawPlayersList = () => {
    const htmlPLayersList = document.getElementById("playersList")
    htmlPLayersList.innerHTML = ""
    for (let i = 0; i < myPlayersList.length; ++i) {
        const player = myPlayersList[i]
        const isGameMaster = player.id === myGameMasterID ? " class = gameMaster " : ""
        htmlPLayersList.innerHTML += "<div>"
        htmlPLayersList.innerHTML += "<span " + isGameMaster + "style = \"color : " + player.color + "\">" + player.name + " " + player.score + 'pts ' + (myGamePhase === VIEWING_VOTES ? ' + ' + player.scoreDelta : '') + "</span>"
        if (player.hasPlayed && myGamePhase !== VIEWING_VOTES) {
            htmlPLayersList.innerHTML += '<img src = "client/img/check.png" class = "hasPlayedIcon" />'
        }
        htmlPLayersList.innerHTML += "</div>"
    }
}

const drawHint = () => {
    const html = document.getElementById("hint")
    html.innerHTML = ''
    if (myPlayerID === myGameMasterID) {
        html.innerHTML += '<input type="text" value = "' + myHint + '" id="hintInput" class="form-control" placeholder="My Hint is . . ." onchange = emitHint()>'
    }
    if (myHint) {
        html.innerHTML += '<p id="hintText">The hint is : <b> ' + myHint + '</b></p>'
    }
}

const draw = () => {
    if (myRoomID !== null) {
        drawNameInput()
        drawRoomInfo()
        drawHint()
        drawPlayersList()
        drawStateMessage()
        if (myGamePhase === VOTING_FOR_A_CARD)
            drawCardsAtPlay()
        else if (myGamePhase === VIEWING_VOTES)
            drawCardsAtPlayAndVotesResult()
        else
            drawCardsAtPlayHidden()
        drawHand()
    }
}

window.onfocus = () => draw()