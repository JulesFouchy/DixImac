const express = require('express')
const app = express()
const serv = require('http').Server(app)

app.get('/', (req, res) => res.sendFile(__dirname + '/client/index.html'))
app.use('/client', express.static(__dirname + '/client'))

serv.listen(2000, () => console.log('Server started.'))

const io = require('socket.io')(serv,{})

const fs = require("fs"), { createCanvas } = require("canvas")

// CONST

const cardW = 1000
const cardH = 1500

const NB_CARDS_PER_HAND = 7

// Utils

const sendToAllSockets = (eventName, data) => {
	for (const socket of Object.values(socketList)){
		socket.emit(eventName, data)
	}
}

const randomColor = () => {
  const letters = '0123456789ABCDEF'
  let color = '#'
  for (let i = 0; i < 6; i++)
    color += letters[Math.floor(Math.random() * 16)]
  return color
}

const Path = require('path');
const deleteFolderRecursive = (path) => {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach((file, index) => {
      const curPath = Path.join(path, file);
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

// Card Factory

const cardObject = (url) => ({
	url
})

const canvasToDrawCards = createCanvas(cardW, cardH);
const ctxDC = canvasToDrawCards.getContext("2d");

/*const createCardFor = (playerID, cardID) => {
	// Drawing
	ctxDC.fillStyle = randomColor()
	ctxDC.fillRect(0, 0, cardW, cardH)
	// Write file
	const buffer = canvasToDrawCards.toBuffer("image/png")
	const folder = "images/"+playerID
	const url = folder+"/"+cardID+".png"
	fs.mkdirSync(folder, { recursive: true })
	fs.writeFileSync(url, buffer)
	return cardObject(url)
}*/

const drawCard = () => {
	// Drawing
	ctxDC.fillStyle = randomColor()
	ctxDC.fillRect(0, 0, cardW, cardH)
	// Return data encrypted as string
	return canvasToDrawCards.toDataURL("image/png")
}

const drawHand = () => {
	let res = []
	for (let i = 0; i < NB_CARDS_PER_HAND; ++i)
		res.push(drawCard())
	return res
}

//--------PLAYER------------

const createPlayer = (name) => {
	const player = {
		name,
		color : randomColor(),
		hand: drawHand()
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
	socket.emit('HandChanged', {cardsImgData: socket.player.hand})
	// Update playerLists
	updatePlayerListsOfClients();
	// On disconnect
	socket.on('disconnect', () => {
		//deleteFolderRecursive("images/"+socket.id)
		delete socketList[socket.id]
		updatePlayerListsOfClients()
	})
	// On changeGameMaster
	socket.on('changeGameMaster', () => changeGameMaster())
})