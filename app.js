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

const applyToAllSockets = (func) => {
	for (const socket of Object.values(socketList))
		func(socket)
}

const sendToAllSockets = (eventName, data) => {
	applyToAllSockets( socket => socket.emit(eventName, data) )
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

const computeCardsAtPlay = () => {
	if (allPLayersHaveSelectedACard()){
		let cards = []
		applyToAllSockets( socket =>
			cards.push(socket.player.hand[socket.selectedCardIndex])
		)
		return cards
	}
	return []
}

// -------- GAME STATE --------

	// -------- GAME PHASE --------

const GAME_MASTER_PICKING_A_CARD = 0
const OTHER_PLAYERS_PICKING_A_CARD = 1
const LOOKING_FOR_GAME_MASTER_CARD = 2

let gamePhase = GAME_MASTER_PICKING_A_CARD

const moveToNextPhase = () => {
	gamePhase = (gamePhase + 1) % 3
	sendToAllSockets('ThisIsGamePhase', {gamePhase})
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
	const cardsAtPlay = computeCardsAtPlay()
	socket.emit('ThisIsCardsAtPlay', {
		cards: cardsAtPlay
	})
}

const sendCardsAtPlayToAll = () => {
	const cardsAtPlay = computeCardsAtPlay()
	sendToAllSockets('ThisIsCardsAtPlay', {
		cards: cardsAtPlay
	})
}

// -------- PLAYER --------

const createPlayer = (name) => {
	const player = {
		name,
		color : randomColor(),
		hand: pickAHand()
	}
	return player
}

const updatePlayerListsOfClients = () => {
	sendToAllSockets('PlayerListChanged', {playerList: Object.values(socketList).map(el=>({
			name: el.player.name,
			color: el.player.color
	}))})
}

// -------- SOCKET --------

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
	sendGameState(socket)
	// Update playerLists
	updatePlayerListsOfClients();
	// On card selection
	socket.on('SelectedCardChanged', (data) => {
		switch(gamePhase) {
		  case GAME_MASTER_PICKING_A_CARD:
			if (socket.id === gameMasterIdFromIndex(gameMasterIndex)) {
				setSelectedCard(socket, data.cardIndex)
				moveToNextPhase()
			}
		    break
		  case OTHER_PLAYERS_PICKING_A_CARD:
		    if (socket.id !== gameMasterIdFromIndex(gameMasterIndex)) {
				setSelectedCard(socket, data.cardIndex)
				if (allPLayersHaveSelectedACard()){
					moveToNextPhase()
					sendCardsAtPlayToAll()
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