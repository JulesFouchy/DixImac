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
	socket.emit('ThisIsCardsAtPlay', {
		cards: getCardsAtPlay()
	})
}

const sendCardsAtPlayToAll = () => {
	sendToAllSockets('ThisIsCardsAtPlay', {
		cards: getCardsAtPlay()
	})
}

// -------- PLAYER --------

const createPlayer = (name) => {
	const player = {
		name,
		color : randomColor()
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
	// -------- ID --------
	socketList[socket.id] = socket
	socket.emit('ThisIsYourID', {id: socket.id})

	// -------- PLAYER --------
	socket.player = createPlayer('Player'+randomColor())
	setSelectedCardInHand(socket, null)
	setSelectedCardAtPlay(socket, null)

	// -------- HAND --------
	socket.hand = pickAHand()
	socket.emit('ThisIsYourHand', {cards: socket.hand})

	// -------- GAME STATE --------
	sendGameState(socket)

	// -------- PLAYERS LIST --------
	updatePlayerListsOfClients();

	// -------- ON CARD SELECTION --------
	socket.on('SelectedCardChanged', (data) => {
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
		  case LOOKING_FOR_GAME_MASTER_CARD:

		  	break
		  default:
		    break
		}
	})

	socket.on('SelectedCardAtPlayChanged', (data) => {
		if (gamePhase === LOOKING_FOR_GAME_MASTER_CARD && socket.id !== gameMasterID()) {
			setSelectedCardAtPlay(socket, data.cardIndex)
			if (allPlayersHaveSelectedACardAtPlay()){
				changeGameMaster()
				sendToAllSockets('NewRound', {})
				moveToNextPhase()
			}
		}
	})

	// -------- ON DISCONNECT --------
	socket.on('disconnect', () => {
		//deleteFolderRecursive("images/"+socket.id)
		delete socketList[socket.id]
		updatePlayerListsOfClients()
	})
})