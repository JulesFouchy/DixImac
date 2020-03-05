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


//--------PLAYER------------
function randomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

const createPlayer = (name) => {
	const player = {
		name,
		color : randomColor(),
		cards:[]
	}
	for(var i = 0; i < 7; ++i)
		player.cards.push(randomColor())
	return player
}

const printPlayer = player => {
	console.log(player.name)
	console.log(player.cards)
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
	console.log(currentGameMasterIndex)
}

// Sockets

const socketList = {}

io.sockets.on('connection', socket => {
	console.log('Socket Connection : ' + socket.id)
	socketList[socket.id] = socket
	socket.player = createPlayer('Player'+randomColor())
	printPlayer(socket.player)
	// Send hand
	socket.emit('HandChanged', socket.player)
	// Update playerLists
	console.log('**********************')
	updatePlayerListsOfClients();
	// On disconnect
	socket.on('disconnect', () => {
		delete socketList[socket.id]
		updatePlayerListsOfClients()
	})
})

//setInterval( () => {
//	for (const socket of Object.values(socketList)){
//		socket.emit('NbCards', {
//			nbCards: socket.nbCards
//		})
//	}
//	console.log("-------------")
//}, 1000/60.0 * 60 * 1)

setInterval( () => {
	changeGameMaster()
	console.log("-------------")
}, 1000/60.0 * 60 * 1)