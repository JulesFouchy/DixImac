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

const NB_CARDS_PER_HAND = 7

// -------- RANDOM --------

/*const randomColor = () => {
  const letters = '0123456789ABCDEF'
  let color = '#'
  for (let i = 0; i < 6; i++)
    color += letters[Math.floor(Math.random() * 16)]
  return color
}*/

const randomColor = () => {
  const letters = '0123456789ABCDEF'
  let color = '#'
  for (let i = 0; i < 3; i++) {
  	const nb = Math.floor(Math.random()*150)
    color += letters[Math.floor(nb/16)] + letters[nb%16]
  }
  return color
}

const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// -------- UTILS FOR SOCKETS --------

const applyToAllSockets = (func) => {
	for (const socket of Object.values(socketList))
		func(socket)
}

const sendToAllSockets = (eventName, data) => {
	applyToAllSockets( socket => socket.emit(eventName, data) )
}

const getNbOfPlayers = () => Object.values(socketList).length

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

	if (Math.random() < 0.5) {
		return {
			script: 'background(random(0, 255), random(0, 255), random(0, 255))',
			seed: Math.floor(1000000*Math.random())
		}
	}

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

const computeCardsAtPlayAndTheirPlayers = () => {
	let cards = []
	applyToAllSockets( socket => {
		if (socket.selectedCardInHandIndex !== null)
			cards.push({
				card: socket.hand[socket.selectedCardInHandIndex],
				player: socket
			})
	})
	return shuffle(cards)
}

let cardsAtPlayAndTheirPlayers = []

const getCardsAtPlay = () => cardsAtPlayAndTheirPlayers.map( el => el.card )

const countPoints = () => {
	let nbVotesForGameMaster = 0
	applyToAllSockets( socket => {
		if (socket.id !== gameMasterID()) {
			const votedPlayer = cardsAtPlayAndTheirPlayers[socket.selectedCardAtPlayIndex].player
			if (votedPlayer.id !== gameMasterID()) {
				if (votedPlayer.id !== socket.id)
					votedPlayer.score += 1
				else
					votedPlayer.score -= 2
			}
			else {
				socket.score += 1
				nbVotesForGameMaster++
			}
		}
	})
	if ((nbVotesForGameMaster != 0) && (nbVotesForGameMaster != getNbOfPlayers()-1))
		socketList[gameMasterID()].score += 2
	// Send new scores
	applyToAllSockets(sendPlayersList)
}

const getVotesPerCard = () => {
	let res = Array(getNbOfPlayers())
	for (let i = 0; i < res.length; ++i)
		res[i] = new Array()
	applyToAllSockets(socket => {
		if (socket.id !== gameMasterID()) {
			res[socket.selectedCardAtPlayIndex].push({
				name: socket.playerName,
				color: socket.playerColor
			})
		}
	})
	return res
}

const getGameMastersCardIndex = () => {
	for (let i = 0; i < cardsAtPlayAndTheirPlayers.length; ++i) {
		if (cardsAtPlayAndTheirPlayers[i].player.id === gameMasterID())
			return i
	}
}

// -------- GAME STATE --------

	// -------- GAME PHASE --------

const gpGAME_MASTER_PICKING_A_CARD = {
	onEnter: () => {
		resetSelectedCards()
	},
	checkForEndOfPhase: () => {
		
	},
	onSelectedCardInHandChanged: (socket, index) => {
		if (socket.id === gameMasterID()) {
			setSelectedCardInHand(socket, index)
			moveToNextPhase()
		}
	},
	onSelectedCardAtPlayChanged: (socket, index) => {

	},
	onExit: () => {

	}
}

const gpOTHER_PLAYERS_PICKING_A_CARD = {
	onEnter: () => {},
	checkForEndOfPhase: () => {
		if (allPlayersHaveSelectedACardInHand()){
				moveToNextPhase()
		}
	},
	onSelectedCardInHandChanged: (socket, index) => {
	    if (socket.id !== gameMasterID()) {
			setSelectedCardInHand(socket, index)
			gpOTHER_PLAYERS_PICKING_A_CARD.checkForEndOfPhase()
		}
	},
	onSelectedCardAtPlayChanged: (socket, index) => {
		
	},
	onExit: () => {
		cardsAtPlayAndTheirPlayers = computeCardsAtPlayAndTheirPlayers()
		sendCardsAtPlayToAll()
	}
}

const gpVOTING_FOR_A_CARD = {
	onEnter: () => {},
	checkForEndOfPhase: () => {
		if (allPlayersHaveSelectedACardAtPlay()){
			moveToNextPhase()
		}
	},
	onSelectedCardInHandChanged: (socket, index) => {

	},
	onSelectedCardAtPlayChanged: (socket, index) => {
		if (socket.id !== gameMasterID()) {
			setSelectedCardAtPlay(socket, index)
			gpVOTING_FOR_A_CARD.checkForEndOfPhase()
		}
	},
	onExit: () => {
		countPoints()
	}
}

const gpVIEWING_VOTES = {
	onEnter: () => {
		sendToAllSockets('ThisIsGameMastersCardIndex', {
			cardIndex: getGameMastersCardIndex()
		})
		sendToAllSockets('ThisIsTheVotes', {
			votes: getVotesPerCard()
		})

		sendToAllSockets('ThisIsCardsAtPlayAndTheirPlayers', {
			list: cardsAtPlayAndTheirPlayers.map(el=>({
				card: el.card,
				playerName: el.player.playerName,
				playerColor: el.player.playerColor
			}))
		})
		setTimeout(moveToNextPhase, 15 * 1000);
	},
	checkForEndOfPhase: () => {
		
	},
	onSelectedCardInHandChanged: (socket, index) => {

	},
	onSelectedCardAtPlayChanged: (socket, index) => {

	},
	onExit: () => {
		cardsAtPlayAndTheirPlayers = []
		changeGameMaster()
		sendToAllSockets('NewRound', {})
		// Draw a new card
		applyToAllSockets((socket) => {
			socket.hand[socket.selectedCardInHandIndex] = pickACard()
			sendHand(socket)
		})
	}
}


let gamePhaseIndex = 0
let gamePhases = 
[
	gpGAME_MASTER_PICKING_A_CARD,
	gpOTHER_PLAYERS_PICKING_A_CARD,
	gpVOTING_FOR_A_CARD,
	gpVIEWING_VOTES
]
const getGamePhase = () => gamePhases[gamePhaseIndex]


const moveToNextPhase = () => {
	getGamePhase().onExit()	
	gamePhaseIndex = (gamePhaseIndex + 1) % 4
	applyToAllSockets(sendGamePhase)
	getGamePhase().onEnter()		
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
		gamePhase: gamePhaseIndex
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
	return Object.values(socketList).map(socket=>({
			name: socket.playerName,
			color: socket.playerColor,
			score: socket.score,
			id: socket.id
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
	socket.score = 0

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
		getGamePhase().onSelectedCardInHandChanged(socket, data.cardIndex)
	})

	socket.on('SelectedCardAtPlayChanged', (data) => {
		getGamePhase().onSelectedCardAtPlayChanged(socket, data.cardIndex)
	})

	// -------- ON DISCONNECT --------
	socket.on('disconnect', () => {
		//deleteFolderRecursive("images/"+socket.id)
		const id = socket.id
		delete socketList[socket.id]
		applyToAllSockets(sendPlayersList)
		if (id === gameMasterID()) {
			gamePhaseIndex = 3
			moveToNextPhase()
		}
		else {
			getGamePhase().checkForEndOfPhase()
		}
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