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

const randomIntID = (nbDigits) => {
  const letters = '0123456789'
  let ID = ''
  for (let i = 0; i < nbDigits; i++)
    ID += letters[Math.floor(Math.random()*10)]
  return ID
}

const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// -------- UTILS FOR SOCKETS --------

const applyToAllSockets = (socketList, func) => {
	for (const socket of Object.values(socketList))
		func(socket)
}

const sendToAllSockets = (socketList, eventName, data) => {
	applyToAllSockets(socketList, socket => socket.emit(eventName, data) )
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

// -------- CARDS LIST HANDLING --------

const setSelectedCardInHand = (socket, index) => {
	socket.selectedCardInHandIndex = index
}

const setSelectedCardAtPlay = (socket, index) => {
	socket.selectedCardAtPlayIndex = index
}

// -------- SOCKETS AND ROOMS --------

const roomsList = {}

const createRoom = () => {
	console.log('Creating a room !')
	const id = randomIntID(6)
	const room = {
		// DATA
		id: id,
		socketList: {},
		deck: [],
		gamePhaseIndex: 0,
		gameMasterIndex: 0,
		cardsAtPlayAndTheirPlayers: [],
		// FUNCTIONS
		pickACard: () => {
			if (room.deck.length === 0)
				room.refillDeck()
			const index = Math.floor(Math.random() * room.deck.length)
			const cardFile = room.deck[index]
			room.deck.splice(index, 1)
			return cardFile
		},
		pickAHand: () => {
			let res = []
			for (let i = 0; i < NB_CARDS_PER_HAND; ++i)
				res.push(room.pickACard())
			return res
		},
		changeGameMaster: () => {
			room.gameMasterIndex = (room.gameMasterIndex+1) % Math.max( Object.keys(room.socketList).length, 1)
			applyToAllSockets(room.socketList, room.sendGameMaster)
		},
		// -------- CARDS LIST HANDLING --------


		getNbOfPlayers: () => Object.values(room.socketList).length,

		allPlayersHaveSelectedACardInHand: () => {
			return Object.values(room.socketList).reduce(
				(bool, socket) => socket.selectedCardInHandIndex !== null && bool,
				true
			)
		},
		allPlayersHaveSelectedACardAtPlay: () => {
			return Object.values(room.socketList).reduce(
				(bool, socket) =>
					(socket.selectedCardAtPlayIndex !== null || socket.id === room.gameMasterID())
					&& bool,
				true
			)
		},
		computeCardsAtPlayAndTheirPlayers: () => {
			let cards = []
			applyToAllSockets(room.socketList, socket => {
				if (socket.selectedCardInHandIndex !== null)
					cards.push({
						card: socket.hand[socket.selectedCardInHandIndex],
						player: socket
					})
			})
			return shuffle(cards)
		},
		getCardsAtPlay: () => room.cardsAtPlayAndTheirPlayers.map( el => el.card ),
		countPoints: () => {
			let nbVotesForGameMaster = 0
			applyToAllSockets(room.socketList, socket => {
				if (socket.id !== room.gameMasterID()) {
					const votedPlayer = room.cardsAtPlayAndTheirPlayers[socket.selectedCardAtPlayIndex].player
					if (votedPlayer.id !== room.gameMasterID()) {
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
			if ((nbVotesForGameMaster != 0) && (nbVotesForGameMaster != room.getNbOfPlayers()-1))
				room.socketList[room.gameMasterID()].score += 2
			// Send new scores
			applyToAllSockets(room.socketList, room.sendPlayersList)
		},
		getVotesPerCard: () => {
			let res = Array(room.getNbOfPlayers())
			for (let i = 0; i < res.length; ++i)
				res[i] = new Array()
			applyToAllSockets(room.socketList, socket => {
				if (socket.id !== room.gameMasterID()) {
					res[socket.selectedCardAtPlayIndex].push({
						name: socket.playerName,
						color: socket.playerColor
					})
				}
			})
			return res
		},
		getGameMastersCardIndex: () => {
			for (let i = 0; i < room.cardsAtPlayAndTheirPlayers.length; ++i) {
				if (room.cardsAtPlayAndTheirPlayers[i].player.id === room.gameMasterID())
					return i
			}
		},

		// -------- GAME STATE --------

			// -------- GAME PHASE --------

		gpGAME_MASTER_PICKING_A_CARD: {
			onEnter: () => {
				room.resetSelectedCards()
			},
			checkForEndOfPhase: () => {
				
			},
			onSelectedCardInHandChanged: (socket, index) => {
				if (socket.id === room.gameMasterID()) {
					setSelectedCardInHand(socket, index)
					room.moveToNextPhase()
				}
			},
			onSelectedCardAtPlayChanged: (socket, index) => {

			},
			onExit: () => {

			}
		},

		gpOTHER_PLAYERS_PICKING_A_CARD: {
			onEnter: () => {},
			checkForEndOfPhase: () => {
				if (room.allPlayersHaveSelectedACardInHand()){
						room.moveToNextPhase()
				}
			},
			onSelectedCardInHandChanged: (socket, index) => {
			    if (socket.id !== room.gameMasterID()) {
					setSelectedCardInHand(socket, index)
					room.gpOTHER_PLAYERS_PICKING_A_CARD.checkForEndOfPhase()
				}
			},
			onSelectedCardAtPlayChanged: (socket, index) => {
				
			},
			onExit: () => {
				room.cardsAtPlayAndTheirPlayers = room.computeCardsAtPlayAndTheirPlayers()
				room.sendCardsAtPlayToAll()
			}
		},

		gpVOTING_FOR_A_CARD: {
			onEnter: () => {},
			checkForEndOfPhase: () => {
				if (room.allPlayersHaveSelectedACardAtPlay()){
					room.moveToNextPhase()
				}
			},
			onSelectedCardInHandChanged: (socket, index) => {

			},
			onSelectedCardAtPlayChanged: (socket, index) => {
				if (socket.id !== room.gameMasterID()) {
					setSelectedCardAtPlay(socket, index)
					room.gpVOTING_FOR_A_CARD.checkForEndOfPhase()
				}
			},
			onExit: () => {
				room.countPoints()
			}
		},

		gpVIEWING_VOTES: {
			onEnter: () => {
				sendToAllSockets(room.socketList, 'ThisIsGameMastersCardIndex', {
					cardIndex: room.getGameMastersCardIndex()
				})
				sendToAllSockets(room.socketList, 'ThisIsTheVotes', {
					votes: room.getVotesPerCard()
				})

				sendToAllSockets(room.socketList, 'ThisIsCardsAtPlayAndTheirPlayers', {
					list: room.cardsAtPlayAndTheirPlayers.map(el=>({
						card: el.card,
						playerName: el.player.playerName,
						playerColor: el.player.playerColor
					}))
				})
				setTimeout(room.moveToNextPhase, 15 * 1000);
			},
			checkForEndOfPhase: () => {
				
			},
			onSelectedCardInHandChanged: (socket, index) => {

			},
			onSelectedCardAtPlayChanged: (socket, index) => {

			},
			onExit: () => {
				room.cardsAtPlayAndTheirPlayers = []
				room.changeGameMaster()
				sendToAllSockets(room.socketList, 'NewRound', {})
				// Draw a new card
				applyToAllSockets(room.socketList, (socket) => {
					socket.hand[socket.selectedCardInHandIndex] = room.pickACard()
					room.sendHand(socket)
				})
			}
		},

		gamePhases: [],

		getGamePhase: () => room.gamePhases[room.gamePhaseIndex],

		moveToNextPhase: () => {
			room.getGamePhase().onExit()	
			room.gamePhaseIndex = (room.gamePhaseIndex + 1) % 4
			applyToAllSockets(room.socketList, room.sendGamePhase)
			room.getGamePhase().onEnter()		
		},
		resetSelectedCards: () => {
			applyToAllSockets(room.socketList, socket => {
				setSelectedCardInHand(socket, null)
				setSelectedCardAtPlay(socket, null)
			})
		},

			// -------- GAME MASTER --------

		gameMasterIdFromIndex: (index) => {
			const list = Object.values(room.socketList)
			if (index >= list.length)
				index = list.length - 1
			return list[index].id
		},
		gameMasterID: () => room.gameMasterIdFromIndex(room.gameMasterIndex),

			// -------- SENDING GAME STATE --------


		sendGameState: (socket) => {
			room.sendGamePhase  (socket)
			room.sendGameMaster (socket)
			room.sendCardsAtPlay(socket)
			room.sendPlayersList(socket)
		},

		sendGamePhase: (socket) => {
			socket.emit('ThisIsGamePhase', {
				gamePhase: room.gamePhaseIndex
			})
		},

		sendGameMaster: (socket) => {
			socket.emit('ThisIsGameMaster', {
				gameMasterID : room.gameMasterID()
			})
		},

		sendCardsAtPlay: (socket) => {
			socket.emit('ThisIsCardsAtPlay', {
				cards: room.getCardsAtPlay()
			})
		},

		sendCardsAtPlayToAll: () => {
			sendToAllSockets(room.socketList, 'ThisIsCardsAtPlay', {
				cards: room.getCardsAtPlay()
			})
		},

		sendHand: (socket) => {
			socket.emit('ThisIsYourHand', {cards: socket.hand})
		},

		sendPlayersList: (socket) => {
			socket.emit('ThisIsPlayersList', {
				playersList: room.getPlayersList()
			})
		},

		getPlayersList: () => {
			return Object.values(room.socketList).map(socket=>({
					name: socket.playerName,
					color: socket.playerColor,
					score: socket.score,
					id: socket.id
			}))
		},

		onPlayerArrival: (socket) => {
			// -------- ID --------
			room.socketList[socket.id] = socket
			socket.emit('ThisIsYourID', {id: socket.id})
			socket.emit('ThisIsRoomID', {id: room.id})

			// -------- PLAYER --------
			//socket.playerName = name
			socket.playerColor = randomColor()
			applyToAllSockets(room.socketList, room.sendPlayersList)
			socket.score = 0

			setSelectedCardInHand(socket, null)
			setSelectedCardAtPlay(socket, null)

			// -------- NAME --------
			socket.on('ThisIsMyName', data => {
				socket.playerName = data.name
				applyToAllSockets(room.socketList, room.sendPlayersList)
			})

			// -------- HAND --------
			socket.hand = room.pickAHand()
			room.sendHand(socket)

			// -------- GAME STATE --------
			room.sendGameState(socket)

			// -------- PLAYERS LIST --------
			applyToAllSockets(room.socketList, room.sendPlayersList)

			// -------- ON CARD SELECTION --------
			socket.on('SelectedCardInHandChanged', (data) => {
				room.getGamePhase().onSelectedCardInHandChanged(socket, data.cardIndex)
			})

			socket.on('SelectedCardAtPlayChanged', (data) => {
				room.getGamePhase().onSelectedCardAtPlayChanged(socket, data.cardIndex)
			})

			// -------- ON DISCONNECT --------
			socket.on('disconnect', () => {
				const id = socket.id
				delete room.socketList[socket.id]
				if (room.getNbOfPlayers() === 0) {
					delete roomsList[room.id]
				}
				else {
					applyToAllSockets(room.socketList, room.sendPlayersList)
					if (id === room.gameMasterID()) {
						room.gamePhaseIndex = 3
						room.moveToNextPhase()
					}
					else {
						room.getGamePhase().checkForEndOfPhase()
					}
				}
			})
		},

		refillDeck: () => {
			// JPG / PNG images
			const fixedImgDir = path.join(__dirname, 'client/cards/originalCards')
			fs.readdir(fixedImgDir, function (err, files) {
			    if (err) return console.log('Unable to scan directory: ' + err)

			    files.forEach(function (file) {
			        room.deck.push('client/cards/originalCards/'+file)
			        //console.log('client/cards/originalCards/'+file)
			    })
			})
			// P5 scripts
			const p5ScriptsDir = path.join(__dirname, 'images/P5scripts')
			fs.readdir(p5ScriptsDir, function (err, files) {
			    if (err) return console.log('Unable to scan directory: ' + err)

			    files.forEach(function (file) {
				    room.deck.push({
						script: fs.readFileSync(p5ScriptsDir+"/"+file, 'utf8'),
						seed: Math.floor(1000000*Math.random())
					})
			    })
			})
			console.log('Deck ready !')
		}
	}
	room.gamePhases = [
			room.gpGAME_MASTER_PICKING_A_CARD,
			room.gpOTHER_PLAYERS_PICKING_A_CARD,
			room.gpVOTING_FOR_A_CARD,
			room.gpVIEWING_VOTES
	]
	room.refillDeck()
	roomsList[id] = room
	return id
}

const joinRoom = (socket, roomID) => {
	console.log('joining room')
	if (roomsList[roomID]) {
		console.log('found room !')
		roomsList[roomID].onPlayerArrival(socket) 
	}
	else
		console.log('No room with this ID : ' + roomID)
}

io.sockets.on('connection', socket => {
	socket.on('ThisIsMyName', data => {
		socket.playerName = data.name
	})
	socket.on('CreateRoom', () => {
		const roomID = createRoom()
		console.log(roomID)
		setTimeout(() => {
			joinRoom(socket, roomID)
		}, 2 * 1000);
	})

	socket.on('JoinRoom', (data) => {
		joinRoom(socket, data.roomID)
	})
})