const express = require('express')
const app = express()
const serv = require('http').Server(app)

app.get('/', (req, res) => res.sendFile(__dirname + '/client/index.html'))
app.use('/client', express.static(__dirname + '/client'))

serv.listen(process.env.PORT || 2000, () => console.log('Server started.'))

const io = require('socket.io')(serv,{})

const fs = require("fs"), { createCanvas } = require("canvas")
const path = require('path')

// -------- CONSTANTS --------

const cardW = 1000
const cardH = 1500

const NB_CARDS_PER_HAND = 5

// -------- RANDOM --------

const randomColor = () => {
  const letters = '0123456789ABCDEF'
  let color = '#'
  for (let i = 0; i < 6; i++)
    color += letters[Math.floor(Math.random() * 16)]
  return color
}

// -------- UTILS FOR SOCKETS --------

const applyToAllSockets = (func) => {
	for (const socket of Object.values(socketList))
		func(socket)
}

const sendToAllSockets = (eventName, data) => {
	applyToAllSockets( socket => socket.emit(eventName, data) )
}

// -------- UTILS FOR IMG FILES --------

const base64FromFile = (file) => {
    // read binary data
    console.log(file)
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
}

// -------- CARD FACTORY --------

const canvasToDrawCards = createCanvas(cardW, cardH);
const ctxDC = canvasToDrawCards.getContext("2d");

let deck = []

const refillDeck = () => {
	const directoryPath = path.join(__dirname, 'client/cards/originalCards')
	fs.readdir(directoryPath, function (err, files) {
	    //handling error
	    if (err) {
	        return console.log('Unable to scan directory: ' + err);
	    } 
	    //listing all files using forEach
	    files.forEach(function (file) {
	        // Do whatever you want to do with the file
	        deck.push('client/cards/originalCards/'+file); 
	    });
	    console.log('Deck ready !')
	});
}

refillDeck()

const cardObject = (url) => ({
	url
})

const pickACard = () => {
	/*// Drawing
	ctxDC.fillStyle = randomColor()
	ctxDC.fillRect(0, 0, cardW, cardH)
	// Return data encrypted as string
	return canvasToDrawCards.toDataURL("image/png")*/

	if (deck.length === 0)
		refillDeck()
	const index = Math.floor(Math.random() * deck.length)
	const cardFile = deck[index]
	deck.splice(index, 1)
	return cardFile
	//return base64FromFile(cardFile)
}

const pickAHand = () => {
	let res = []
	for (let i = 0; i < NB_CARDS_PER_HAND; ++i)
		res.push(pickACard())
	return res
}

// -------- CARDS LIST HANDLING --------

const setSelectedCardInHand = (socket, index) => {
	socket.selectedCardInHandIndex = index
}

const setSelectedCardAtPlay = (socket, index) => {
	socket.selectedCardAtPlayIndex = index
}

const allPlayersHaveSelectedACardInHand = () => {
	return Object.values(socketList).reduce(
		(bool, socket) => socket.selectedCardInHandIndex !== null && bool,
		true
	)
}

const allPlayersHaveSelectedACardAtPlay = () => {
	return Object.values(socketList).reduce(
		(bool, socket) =>
			(socket.selectedCardAtPlayIndex !== null || socket.id === gameMasterID())
			&& bool,
		true
	)
}

const getCardsAtPlay = () => {
	let cards = []
	applyToAllSockets( socket => {
		if (socket.selectedCardInHandIndex !== null)
			cards.push(socket.hand[socket.selectedCardInHandIndex])
	})
	return cards
}

// -------- GAME STATE --------

	// -------- GAME PHASE --------

const GAME_MASTER_PICKING_A_CARD = 0
const OTHER_PLAYERS_PICKING_A_CARD = 1
const VOTING_FOR_A_CARD = 2

let gamePhase = GAME_MASTER_PICKING_A_CARD

const moveToNextPhase = () => {
	gamePhase = (gamePhase + 1) % 3
	sendToAllSockets('ThisIsGamePhase', {gamePhase})
	if (gamePhase === GAME_MASTER_PICKING_A_CARD)
		resetSelectedCards()
}

const resetSelectedCards = () => {
	applyToAllSockets( socket => {
		setSelectedCardInHand(socket, null)
		setSelectedCardAtPlay(socket, null)
	})
}

	// -------- GAME MASTER --------

let gameMasterIndex = 0

const gameMasterIdFromIndex = (index) => Object.values(socketList)[index].id
const gameMasterID = () => gameMasterIdFromIndex(gameMasterIndex)

const changeGameMaster = () => {
	gameMasterIndex = (gameMasterIndex+1) % Math.max( Object.keys(socketList).length, 1)
	applyToAllSockets(sendGameMaster)
}

	// -------- SENDING GAME STATE --------


const sendGameState = (socket) => {
	sendGamePhase  (socket)
	sendGameMaster (socket)
	sendCardsAtPlay(socket)
	sendPlayersList(socket)
}

const sendGamePhase = (socket) => {
	socket.emit('ThisIsGamePhase', {
		gamePhase
	})
}

const sendGameMaster = (socket) => {
	socket.emit('ThisIsGameMaster', {
		gameMasterID : gameMasterID()
	})
}

const sendCardsAtPlay = (socket) => {
	socket.emit('ThisIsCardsAtPlay', {
		cards: getCardsAtPlay()
	})
}

const sendCardsAtPlayToAll = () => {
	sendToAllSockets('ThisIsCardsAtPlay', {
		cards: getCardsAtPlay()
	})
}

const sendHand = (socket) => {
	socket.emit('ThisIsYourHand', {cards: socket.hand})
}

const sendPlayersList = (socket) => {
	socket.emit('ThisIsPlayersList', {
		playersList: getPlayersList()
	})
}

const getPlayersList = () => {
	return Object.values(socketList).map(el=>({
			name: el.playerName,
			color: el.playerColor
	}))
}

// -------- SOCKET --------

const socketList = {}

const onPlayerArrival = (socket, name) => {
	// -------- ID --------
	socketList[socket.id] = socket
	socket.emit('ThisIsYourID', {id: socket.id})

	// -------- PLAYER --------
	socket.playerName = name
	socket.playerColor = randomColor()
	applyToAllSockets(sendPlayersList)

	setSelectedCardInHand(socket, null)
	setSelectedCardAtPlay(socket, null)

	// -------- NAME --------
	socket.on('ThisIsMyName', data => {
		console.log("Name change")
		socket.playerName = data.name
		applyToAllSockets(sendPlayersList)
	})

	// -------- HAND --------
	socket.hand = pickAHand()
	sendHand(socket)

	// -------- GAME STATE --------
	sendGameState(socket)

	// -------- PLAYERS LIST --------
	applyToAllSockets(sendPlayersList)

	// -------- ON CARD SELECTION --------
	socket.on('SelectedCardInHandChanged', (data) => {
		switch(gamePhase) {
		  case GAME_MASTER_PICKING_A_CARD:
			if (socket.id === gameMasterID()) {
				setSelectedCardInHand(socket, data.cardIndex)
				moveToNextPhase()
			}
		    break
		  case OTHER_PLAYERS_PICKING_A_CARD:
		    if (socket.id !== gameMasterID()) {
				setSelectedCardInHand(socket, data.cardIndex)
				if (allPlayersHaveSelectedACardInHand()){
					moveToNextPhase()
					sendCardsAtPlayToAll()
				}
			}
		    break
		  case VOTING_FOR_A_CARD:

		  	break
		  default:
		    break
		}
	})

	socket.on('SelectedCardAtPlayChanged', (data) => {
		if (gamePhase === VOTING_FOR_A_CARD && socket.id !== gameMasterID()) {
			setSelectedCardAtPlay(socket, data.cardIndex)
			if (allPlayersHaveSelectedACardAtPlay()){
				changeGameMaster()
				sendToAllSockets('NewRound', {})
				// Draw a new card
				applyToAllSockets((socket) => {
					socket.hand[socket.selectedCardInHandIndex] = pickACard()
					sendHand(socket)
				})
				//
				moveToNextPhase()
			}
		}
	})

	// -------- ON DISCONNECT --------
	socket.on('disconnect', () => {
		//deleteFolderRecursive("images/"+socket.id)
		delete socketList[socket.id]
		applyToAllSockets(sendPlayersList)
	})
}

io.sockets.on('connection', socket => {
	socket.on('ThisIsMyName', data => {
		if (!socketList[socket.id]) {
			console.log("Name NEEEW")
			onPlayerArrival(socket, data.name)
		}
	})
})