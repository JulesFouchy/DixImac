let bDontSendHintJustYet = false

const drawNameInput = () => {
    const htmlEl = document.getElementById('pseudo-input')
    htmlEl.value = myName
}

const drawRoomInfo = () => {
    const htmlEl = document.getElementById('roomInfo')
    htmlEl.innerHTML = 'You are in room <b>' + myRoomID + '</b>'
}

const wrapOnClick = (onClick) => {
    return 'if (event.target.tagName !== \'A\') ' + onClick
}

const cardDiv = (cardObj, isSelectedCard, isGameMastersCard, onClick) => {
    return '<div class = ' + (isSelectedCard ? '\"selectedCard dxCard\"' : '\"dxCard\"') 
            + (isGameMastersCard ? ' id = "gameMastersCard"' : '')
            + 'onclick = "' + wrapOnClick(onClick) + '"' + '>'
                +'<img src = ' + renderCard(cardObj)
                + ' class = cardImg'
        + '></img>'
        + (cardObj.authorName ? '<div class="dxCardInfos">'
        + '<div class="author">'
        + (cardObj.linkToGalery ? '<a href="' + cardObj.linkToGalery +'"  target="_blank">' : '')
        + 'by ' + cardObj.authorName 
        + (cardObj.linkToGalery ? '</a>' : '')
        + '</div>'
        + '</div >' : '')
        +'</div > '
}

const drawCardList = (html, list, onClick, selectedCardIndex) => {
    html.innerHTML = ''
    for (let i = 0; i < list.length; ++i) {
        html.innerHTML += cardDiv(list[i], selectedCardIndex === i, false, onClick + '( ' + i + ')')
    }
}

const drawHand = () => drawCardList(document.getElementById("yourHand"), myHand, "onCardInHandClick", mySelectedCardInHandIndex)

const drawCardsAtPlay = () => drawCardList(document.getElementById("cardsAtPlay"), myCardsAtPlay, "onCardAtPlayClick", mySelectedCardAtPlayIndex)

const getSpanOfCardVoters = (cardAtPLayIndex) => {
    const list = myVoteResults[cardAtPLayIndex]
    let res = '<span class = "cardVoters">'
    for (let i = 0; i < list.length; ++i) {
        res += '<span class = "cardVoter nameDuringResults">' + list[i].name + '</span>'
    }
    res += '</span>'
    return res
}

const drawCardsAtPlayAndVotesResult = () => {
    const html = document.getElementById("cardsAtPlay")
    const list = myCardsAtPlayAndTheirPlayers
    html.innerHTML = ''
    for (let i = 0; i < list.length; ++i) {
        const isGameMaster = myGameMastersCardIndex === i
        html.innerHTML = html.innerHTML
            + '<span class = cardAndVotesResult>'
                + '<span class = "cardOwner nameDuringResults ' + (isGameMaster ? 'gameMaster' : '') + '">' + list[i].playerName + '</span>'
                + cardDiv(list[i].card, mySelectedCardAtPlayIndex === i, isGameMaster, '')
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
            message = ((myGameMasterID === myPlayerID) ? '<div class="alert alert-warning" role="alert">You are the Story Teller, pick a card and write a hint</div>' : "Waiting for the Story Teller to pick a card")
            break
        case OTHER_PLAYERS_PICKING_A_CARD:
            message = ((myGameMasterID !== myPlayerID) ? '<div class="alert alert-warning" role="alert">Pick a card that would match the hint</div>' : "Waiting for the other players to pick a card")
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
        htmlPLayersList.innerHTML += "<span " + isGameMaster + 'class="playerName"' + "style = \"color : " + player.color + "\">" + player.name + " " + player.score + 'pts ' + (myGamePhase === VIEWING_VOTES ? ' + ' + player.scoreDelta : '') + "</span>"
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
        html.innerHTML += '<input type="text" autocomplete="off" value = "' + myHint + '" id="hintInput" class="form-control" placeholder="My Hint is . . ." onchange = emitHint()>'
    }
    if (myHint) {
        html.innerHTML += '<div class="alert alert-warning mt-3"><span id="hintText"><i>The hint is</i> : <b> ' + myHint + '</b></span></div>'
    }
    else {
        html.innerHTML += '<div class="alert alert-warning mt-3" style="visibility: hidden;"><span id="hintText"><i>The hint is</i> : <b></b></span></div>'
    }
}

const draw = () => {
    bDontSendHintJustYet = true
    const htmlHint = document.getElementById('hintInput')
    const myHint = htmlHint ? htmlHint.value : ''
    const hadFocus = document.activeElement && document.activeElement.id === 'hintInput'
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
        if (hadFocus) {
            const input = document.getElementById('hintInput')
            input.focus()
            setTimeout(function(){ input.selectionStart = input.selectionEnd = 10000; }, 0);
        }
    }
    bDontSendHintJustYet = false
    const htmlHint2 = document.getElementById('hintInput')
    if (htmlHint2)
        htmlHint2.value = myHint
}

window.onfocus = () => draw()