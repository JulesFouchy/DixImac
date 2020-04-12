const socket = io()

let iHaveChosenMyName = false
let myRoomID = null
let myHand = []
let myPlayersList = []
let myPlayerID
let myGameMasterID
let mySelectedCardInHandIndex = null
let mySelectedCardAtPlayIndex = null
let myGameMastersCardIndex = null
let myGamePhase
let myHint = ''
let myCardsAtPlay = []
let myCardsAtPlayAndTheirPlayers = []
let myVoteResults = []

const onMyNameChange = (newName) => {
	iHaveChosenMyName = true
	socket.emit('ThisIsMyName', {
		name: newName
	})
	draw()
}

const ImGameMaster = () => myPlayerID === myGameMasterID

const GAME_MASTER_PICKING_A_CARD = 0
const OTHER_PLAYERS_PICKING_A_CARD = 1
const VOTING_FOR_A_CARD = 2
const VIEWING_VOTES = 3

const changeSelectedCardInHandFor = (index) => {
	if (index === mySelectedCardInHandIndex)
		mySelectedCardInHandIndex = null
	else
		mySelectedCardInHandIndex = index
	socket.emit('SelectedCardInHandChanged', {
		cardIndex: mySelectedCardInHandIndex
	})	
}

const changeSelectedCardAtPlayFor = (index) => {
	if (index === mySelectedCardAtPlayIndex)
		mySelectedCardAtPlayIndex = null
	else
		mySelectedCardAtPlayIndex = index
	socket.emit('SelectedCardAtPlayChanged', {
		cardIndex: mySelectedCardAtPlayIndex
	})	
}

const onCardInHandClick = (index) => {
	if (myGamePhase === GAME_MASTER_PICKING_A_CARD && ImGameMaster()
	 || myGamePhase === OTHER_PLAYERS_PICKING_A_CARD && !ImGameMaster())
	{
			changeSelectedCardInHandFor(index)
	}
	draw()
}

const onCardAtPlayClick = (index) => {
	if (myGamePhase === VOTING_FOR_A_CARD && !ImGameMaster()) {
		changeSelectedCardAtPlayFor(index)
	}
	draw()
}

convertCardToHTMLFormat = (card) => {
	if (card.script)
		return imageFromP5script(card.script, card.seed)
	return card
}

socket.on('ThisIsRoomID', data => {
	myRoomID = data.id
	draw()
})

socket.on('NewRound', data => {
	mySelectedCardInHandIndex = null
	mySelectedCardAtPlayIndex = null
	myGameMastersCardIndex = null
	myCardsAtPlay = []
	myCardsAtPlayAndTheirPlayers = []
	myVoteResults = []
	myHint = ''
	draw()
})

socket.on('ThisIsYourHand', data => {
	myHand = data.cards
	// for (let i = 0; i < myHand.length; ++i) {
	// 	myHand[i] = convertCardToHTMLFormat(myHand[i])
	// }
	draw()
})

socket.on('ThisIsPlayersList', data => {
	myPlayersList = data.playersList
	draw()
})

socket.on('ThisIsGameMaster', data => {
	myGameMasterID = data.gameMasterID
	draw()
})

socket.on('ThisIsYourID', data => {
	myPlayerID = data.id
})

socket.on('ThisIsGamePhase', data => {
	myGamePhase = data.gamePhase
	draw()
})

socket.on('ThisIsCardsAtPlay', data => {
	myCardsAtPlay = data.cards
	// for (let i = 0; i < myCardsAtPlay.length; ++i) {
	// 	myCardsAtPlay[i] = convertCardToHTMLFormat(myCardsAtPlay[i])
	// }
	draw()
})

socket.on('ThisIsGameMastersCardIndex', data => {
	myGameMastersCardIndex = data.cardIndex
	draw()
})

socket.on('ThisIsCardsAtPlayAndTheirPlayers', data => {
	myCardsAtPlayAndTheirPlayers = data.list
	// for (let i = 0; i < myCardsAtPlayAndTheirPlayers.length; ++i) {
	// 	myCardsAtPlayAndTheirPlayers[i].card = convertCardToHTMLFormat(myCardsAtPlayAndTheirPlayers[i].card)
	// }
	draw()
})

socket.on('ThisIsTheVotes', data => {
	myVoteResults = data.votes
	draw()
})

socket.on('ThisIsTheHint', (data) => {
	myHint = data.hint
	draw()
})