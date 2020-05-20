window.onfocus = () => draw()
const emitCreateRoom = () => socket.emit('CreateRoom')
const joinRoom = () => {
    const roomID = document.getElementById("roomToJoinID").value
    socket.emit('JoinRoom', {roomID})
}
const htmlStateMessage = document.getElementById("stateMessage")
const htmlPLayersList = document.getElementById("playersList")
const htmlCardsAtPlay = document.getElementById("cardsAtPlay")
const htmlYourHand = document.getElementById("yourHand")

const drawCardList = (html, list, onClick, selectedCardIndex) => {
    html.innerHTML = ''
    for (let i = 0; i < list.length; ++i){
        html.innerHTML += '<span><img src = ' + renderCard(list[i])
                        + (selectedCardIndex === i ? ' class = \" selectedImage cardImg\"' : ' class = cardImg')
                        + ' onclick = "' + onClick + '( '+ i + ')\"'
                        + '></img></span>';
    }
}

const drawHand = () => drawCardList(htmlYourHand, myHand, "onCardInHandClick", mySelectedCardInHandIndex)

const drawCardsAtPlay = () => drawCardList(htmlCardsAtPlay, myCardsAtPlay, "onCardAtPlayClick", mySelectedCardAtPlayIndex)

const getSpanOfCardVoters = (cardAtPLayIndex) => {
    const list = myVoteResults[cardAtPLayIndex]
    let res = '<span class = "cardVoters">'
    for (let i = 0; i < list.length; ++i) {
            res += '<span class = "cardVoter" style = "color : '+ list[i].color+'">'+list[i].name+'</span>'
        }
    res += '</span>'
    return res
}

const drawCardsAtPlayAndVotesResult = () => {
    const html = htmlCardsAtPlay
    const list = myCardsAtPlayAndTheirPlayers
    html.innerHTML = ''
    for (let i = 0; i < list.length; ++i){
        html.innerHTML = html.innerHTML
            + '<span class = cardAndVotesResult>'
            + '<span class = "cardOwner" style = "color : '+ list[i].playerColor+'">'+list[i].playerName+'</span>'
            + '<img src = ' + renderCard(list[i].card)
            + (mySelectedCardAtPlayIndex === i ? ' class = \" selectedImage cardImg\"' : ' class = cardImg')
            + (i === myGameMastersCardIndex ? ' id = gameMastersCard' : '')
            + '></img>'
            + getSpanOfCardVoters(i)
            + "</span>";
    }
}

const bYouHaveToPlay = () => {
    switch(myGamePhase) {
        case GAME_MASTER_PICKING_A_CARD:
            return myGameMasterID === myPlayerID && mySelectedCardInHandIndex === null
        case OTHER_PLAYERS_PICKING_A_CARD:
            return myGameMasterID !== myPlayerID && mySelectedCardInHandIndex === null
        case VOTING_FOR_A_CARD:
            return myGameMasterID !== myPlayerID && mySelectedCardAtPlayIndex === null
    }
    return false
}

const displayStateMessage = () => {
    let message
    switch(myGamePhase) {
        case GAME_MASTER_PICKING_A_CARD:
        message = ((myGameMasterID === myPlayerID) ? "Pick a card, dear Story Teller" : "Waiting for the Story Teller to pick a card")
        break
        case OTHER_PLAYERS_PICKING_A_CARD:
        message = ((myGameMasterID !== myPlayerID) ? 'Pick a card that would match the hint' : "Waiting for other players to pick a card")
        break
        case VOTING_FOR_A_CARD:
        message = ((myGameMasterID !== myPlayerID) ? 'Vote for a card' : 'Waiting for the other players to vote for a card')
        break
        case VIEWING_VOTES:
        message = ''
        break
        default:
        break
    }
    htmlStateMessage.innerHTML = '<p class="'+ (bYouHaveToPlay() ? 'youHaveToPlay' : 'youHaveToWait') +'">' + message + '</p>'
}

const drawPlayersList = () => {
    htmlPLayersList.innerHTML = ""
    for (let i = 0; i < myPlayersList.length; ++i){
        const player = myPlayersList[i]
        const isGameMaster = player.id === myGameMasterID ? " class = gameMaster " : ""
        htmlPLayersList.innerHTML += "<div>"
        htmlPLayersList.innerHTML += "<span "+isGameMaster+"style = \"color : "+ player.color+"\">"+ player.name+" "+player.score+'pts '+ (myGamePhase===VIEWING_VOTES?' + '+player.scoreDelta:'')+"</span>"
        if (player.hasPlayed && myGamePhase !== VIEWING_VOTES) {
            htmlPLayersList.innerHTML += '<img src = "client/img/check.png" class = "hasPlayedIcon" />'
        }
        htmlPLayersList.innerHTML += "</div>"
    }
}

const drawRoomInfo = () => {
    const htmlEl = document.getElementById("roomSelection")
    if (myRoomID) {
        htmlEl.innerHTML = '<p> You are in room '+myRoomID+'</p>'
    }
    else {
        htmlEl.innerHTML = 
                '<button id="buttonCreateARoom" onclick="emitCreateRoom()">Create a Room</button>'
            +'<input type="text" value = "" id="roomToJoinID" placeholder="Join a Room : enter its ID" onchange = joinRoom()>'
    }
}

const drawHint = () => {
    const html = document.getElementById("hint")
    html.innerHTML = ''
    if (myPlayerID === myGameMasterID) {
        html.innerHTML += '<input type="text" value = "'+myHint+'" id="hintInput" placeholder="My Hint is . . ." onchange = emitHint()>'
    }
    if (myHint) {
        html.innerHTML += '<p id="hintText">«'+myHint+'»</p>'
    }
}

const emitHint = () => {
    socket.emit('ThisIsTheHint', {
        hint: document.getElementById("hintInput").value
    })
}

const draw = () => {
    if (iHaveChosenMyName) {
        if (myRoomID) {
            drawRoomInfo()
            drawHint()
            drawPlayersList()
            displayStateMessage()
            if (myGamePhase !== VIEWING_VOTES)
                drawCardsAtPlay()
            else
                drawCardsAtPlayAndVotesResult()
            drawHand()
        }
        else {
            drawRoomInfo()
        }
    }
}