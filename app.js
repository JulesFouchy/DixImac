const express = require('express')
const app = express()
const serv = require('http').Server(app)

app.get('/', (req, res) => res.sendFile(__dirname + '/client/index.html'))
app.use('/client', express.static(__dirname + '/client'))

serv.listen(2000, () => console.log('Server started.'))

const io = require('socket.io')(serv,{})

const fs = require("fs"), { createCanvas } = require("canvas")

// -------- CONSTANTS --------

const cardW = 1000
const cardH = 1500

const NB_CARDS_PER_HAND = 7

// -------- RANDOM --------

const randomColor = () => {
  const letters = '0123456789ABCDEF'
  let color = '#'
  for (let i = 0; i < 6; i++)
    color += letters[Math.floor(Math.random() * 16)]
  return color
}

// -------- UTILS FOR SOCKETS --------

const sendToAllSockets = (eventName, data) => {
	for (const socket of Object.values(socketList)){
		socket.emit(eventName, data)
	}
}


// -------- CARD FACTORY --------

const canvasToDrawCards = createCanvas(cardW, cardH);
const ctxDC = canvasToDrawCards.getContext("2d");

const cardObject = (url) => ({
	url
})

const pickACard = () => {
	// Drawing
	ctxDC.fillStyle = randomColor()
	ctxDC.fillRect(0, 0, cardW, cardH)
	// Return data encrypted as string
	return canvasToDrawCards.toDataURL("image/png")
}

const pickAHand = () => {
	let res = []
	for (let i = 0; i < NB_CARDS_PER_HAND; ++i)
		res.push(pickACard())
	return res
}

// -------- CARDS LIST HANDLING --------

const setSelectedCard = (socket, index) => {
	socket.selectedCardIndex = index
}

const allPLayersHaveSelectedACard = () => {
	return Object.values(socketList).reduce(
		(bool, socket) => socket.selectedCardIndex !== null && bool,
		true
	)
}

const sendCardsAtPlay = () => {
	let cards = []
	for (socket of Object.values(socketList)){
		cards.push(socket.player.hand[socket.selectedCardIndex])
	}
	sendToAllSockets('ThisIsCardsAtPlay', {cards})
}

// -------- GAME STATE --------

const GAME_MASTER_PICKING_A_CARD = 0
const OTHER_PLAYERS_PICKING_A_CARD = 1
const LOOKING_FOR_GAME_MASTER_CARD = 2

let gamePhase = 0

const moveToNextState = () => {
	gamePhase = (gamePhase + 1) % 3
	sendToAllSockets('ThisIsGamePhase', {gamePhase})
}

//--------PLAYER------------

const createPlayer = (name) => {
	const player = {
		name,
		color : randomColor(),
		hand: pickAHand()
	}
	return player
}

const printPlayer = player => {
	console.log(player.name)
	console.log(player.hand)
}

const updatePlayerListsOfClients = () => {
	sendToAllSockets('PlayerListChanged', {playerList: Object.values(socketList).map(el=>({
			name: el.player.name,
			color: el.player.color
	}))})
}

// Game state

let currentGameMasterIndex = 0

const gameMasterIdFromIndex = (index) => Object.values(socketList)[index].id

const changeGameMaster = () => {
	currentGameMasterIndex = (currentGameMasterIndex+1) % Math.max( Object.keys(socketList).length, 1)
	sendToAllSockets('GameMasterChanged', {
		gameMasterID : gameMasterIdFromIndex(currentGameMasterIndex)
	})
}

// Sockets

const socketList = {}

io.sockets.on('connection', socket => {
	socketList[socket.id] = socket
	// Create player
	socket.player = createPlayer('Player'+randomColor())
	socket.selectedCardIndex = null
	// Send hand
	socket.emit('HandChanged', {cardsImgData: socket.player.hand})
	// Send socket id and gameMasterID
	socket.emit('ThisIsYourID', {id: socket.id})
	socket.emit('GameMasterChanged', {
		gameMasterID : Object.values(socketList)[currentGameMasterIndex].id
	})
	socket.emit('ThisIsGamePhase', {
		gamePhase
	})
	//socket.emit('This')
	// Update playerLists
	updatePlayerListsOfClients();
	// On card selection
	socket.on('SelectedCardChanged', (data) => {
		switch(gamePhase) {
		  case GAME_MASTER_PICKING_A_CARD:
			if (socket.id === gameMasterIdFromIndex(currentGameMasterIndex)) {
				setSelectedCard(socket, data.cardIndex)
				moveToNextState()
			}
		    break
		  case OTHER_PLAYERS_PICKING_A_CARD:
		    if (socket.id !== gameMasterIdFromIndex(currentGameMasterIndex)) {
				setSelectedCard(socket, data.cardIndex)
				if (allPLayersHaveSelectedACard()){
					moveToNextState()
					sendCardsAtPlay()
				}
			}
		    break
		  case LOOKING_FOR_GAME_MASTER_CARD:

		  	break
		  default:
		    break
		}
	})
	// On disconnect
	socket.on('disconnect', () => {
		//deleteFolderRecursive("images/"+socket.id)
		delete socketList[socket.id]
		updatePlayerListsOfClients()
	})
})