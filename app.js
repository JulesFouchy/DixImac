const express = require('express')
const app = express()
const serv = require('http').Server(app)

app.get('/', (req, res) => res.sendFile(__dirname + '/client/index.html'))
app.use('/client', express.static(__dirname + '/client'))

serv.listen(2000, () => console.log('Server started.'))

const io = require('socket.io')(serv,{})

// Utils

const sendToAllSockets = (eventName, data) => {
	for (const socket of Object.values(socketList)){
		socket.emit(eventName, data)
	}
}

const randomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

//--------PLAYER------------

const createPlayer = (name) => {
	const player = {
		name,
		color : randomColor(),
		hand:[]
	}
	for(var i = 0; i < 7; ++i)
		player.hand.push(randomColor())
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

const changeGameMaster = () => {
	currentGameMasterIndex = (currentGameMasterIndex+1) % Math.max( Object.keys(socketList).length, 1)
	sendToAllSockets('GameMasterChanged', {gameMasterIndex : currentGameMasterIndex})
}

// Sockets

const socketList = {}

io.sockets.on('connection', socket => {
	socketList[socket.id] = socket
	// Create player
	socket.player = createPlayer('Player'+randomColor())
	// Send hand
	socket.emit('HandChanged', {hand: socket.player.hand})
	// Update playerLists
	updatePlayerListsOfClients();
	// On disconnect
	socket.on('disconnect', () => {
		delete socketList[socket.id]
		updatePlayerListsOfClients()
	})
	// On changeGameMaster
	socket.on('changeGameMaster', () => changeGameMaster())
})