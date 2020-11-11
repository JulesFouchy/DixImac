const express = require('express')
const app = express()
const serv = require('http').Server(app)

const { router, dbRequest } = require('./api/api')

// Allow CORS
app.use((req, res, next) => {
	//console.log(req)
	res.header('Access-Control-Allow-Origin', '*')
	next()
})

app.get('/', (req, res) => res.sendFile(__dirname + '/client/index.html'))
app.use('/client', express.static(__dirname + '/client'))
app.use('/api', router)


const PORT = process.env.PORT || 2000
serv.listen(PORT, () => console.log(`Server started on port ${PORT}`))

const io = require('socket.io')(serv,{})

const fs = require("fs"), { createCanvas } = require("canvas")
const path = require('path')

const nodemailer = require('nodemailer')

// -------- CONSTANTS --------

const DELAY_TO_CHANGE_YOUR_MIND_IN_SEC = 2

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

// ---------- STFU (rpz Amalia) -----------

const escapeHtml = (unsafe) => {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;")
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
    //console.log(file)
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
}

// -------- CARDS LIST HANDLING --------

const setSelectedCardInHand = (socket, index) => {
	socket.selectedCardInHandIndex = index
}

const setSelectedCardAtPlay = (socket, index) => {
	socket.selectedCardAtPlayIndex = index
}

// -------- SOCKETS AND ROOMS --------

const roomsList = {}

const createRoom = async () => {
	const id = randomIntID(6)
	const room = {
		// DATA
		dateBegin: new Date(),
		id: id,
		socketList: {},
		deck: [],
		discardPile: [],
		scoresOfPlayersWhoLeftRecently: {},
		hint: '',
		hashChangeGP: null,
		gamePhaseIndex: 0,
		gameMasterIndex: 0,
		cardsAtPlayAndTheirPlayers: [],
		playersWhoConnected: '',
		// FUNCTIONS
		pickACard: () => {
			if (room.deck.length === 0) {
				room.deck = shuffle([...room.discardPile])
				room.discardPile = []
			}
			// const index = Math.floor(Math.random() * room.deck.length)
			const index = 0
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

		hasPlayed: (socket) => {
			return room.getGamePhase().hasPlayed(socket)
		},

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
			// Count points
			applyToAllSockets(room.socketList, socket => {
				if (socket.id !== room.gameMasterID()) {
					const votedPlayer = room.cardsAtPlayAndTheirPlayers[socket.selectedCardAtPlayIndex].player
					if (votedPlayer.id !== room.gameMasterID()) {
						if (votedPlayer.id !== socket.id)
							votedPlayer.scoreDelta += 1
						else
							votedPlayer.scoreDelta -= 2
					}
					else {
						socket.scoreDelta += 2
						nbVotesForGameMaster++
					}
				}
			})
			if ((nbVotesForGameMaster != 0) && (nbVotesForGameMaster != room.getNbOfPlayers()-1))
				room.socketList[room.gameMasterID()].scoreDelta += 3
			// Send score deltas
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
				// Reset hasPlayed checks
				applyToAllSockets(room.socketList, room.sendPlayersList)
			},
			checkForEndOfPhase: () => {
				
			},
			onSelectedCardInHandChanged: (socket, index) => {
				if (socket.id === room.gameMasterID()) {
					setSelectedCardInHand(socket, index)

					room.hashChangeGP = Math.random()
					if (socket.selectedCardInHandIndex !== null) {
						const myHash = room.hashChangeGP
						setTimeout( () => {
							if (room.hashChangeGP === myHash)
								room.moveToNextPhase()
						}, DELAY_TO_CHANGE_YOUR_MIND_IN_SEC * 1000)
					}
				}
			},
			onSelectedCardAtPlayChanged: (socket, index) => {

			},
			onExit: () => {

			},
			hasPlayed: socket => socket.id === room.gameMasterID() && socket.selectedCardInHandIndex !== null
		},

		gpOTHER_PLAYERS_PICKING_A_CARD: {
			onEnter: () => {},
			checkForEndOfPhase: () => {
				if (room.allPlayersHaveSelectedACardInHand()){
					const myHash = room.hashChangeGP
					setTimeout( () => {
						if (room.hashChangeGP === myHash)
							room.moveToNextPhase()
					}, DELAY_TO_CHANGE_YOUR_MIND_IN_SEC * 1000)
				}
			},
			onSelectedCardInHandChanged: (socket, index) => {
			    if (socket.id !== room.gameMasterID()) {
					setSelectedCardInHand(socket, index)
					room.hashChangeGP = Math.random()
					room.gpOTHER_PLAYERS_PICKING_A_CARD.checkForEndOfPhase()
				}
			},
			onSelectedCardAtPlayChanged: (socket, index) => {
				
			},
			onExit: () => {
				room.cardsAtPlayAndTheirPlayers = room.computeCardsAtPlayAndTheirPlayers()
				room.sendCardsAtPlayToAll()
			},
			hasPlayed: (socket) => {
				if (socket.id === room.gameMasterID()) {
					return true
				}
				else {
					return socket.selectedCardInHandIndex !== null
				}
			}
		},

		gpVOTING_FOR_A_CARD: {
			onEnter: () => {},
			checkForEndOfPhase: () => {
				if (room.allPlayersHaveSelectedACardAtPlay()){
					const myHash = room.hashChangeGP
					setTimeout( () => {
						if (room.hashChangeGP === myHash)
							room.moveToNextPhase()
					}, DELAY_TO_CHANGE_YOUR_MIND_IN_SEC * 1000)
				}
			},
			onSelectedCardInHandChanged: (socket, index) => {

			},
			onSelectedCardAtPlayChanged: (socket, index) => {
				if (socket.id !== room.gameMasterID()) {
					setSelectedCardAtPlay(socket, index)
					room.hashChangeGP = Math.random()
					room.gpVOTING_FOR_A_CARD.checkForEndOfPhase()
				}
			},
			onExit: () => {
				room.countPoints()
			},
			hasPlayed: (socket) => {
				if (socket.id === room.gameMasterID()) {
					return true
				}
				else {
					return socket.selectedCardAtPlayIndex !== null
				}
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
				room.hint = ''
				room.changeGameMaster()
				sendToAllSockets(room.socketList, 'NewRound', {})
				// Draw a new card
				applyToAllSockets(room.socketList, (socket) => {
					if (socket.selectedCardInHandIndex !== null) {
						room.discardPile.push(socket.hand[socket.selectedCardInHandIndex])
						socket.hand[socket.selectedCardInHandIndex] = room.pickACard()
						room.sendHand(socket)
					}
				})
				// Update scores
				applyToAllSockets(room.socketList, socket => {
					socket.score += socket.scoreDelta
					socket.scoreDelta = 0
				})
			},
			hasPlayed: (socket) => {
				return true
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
			room.sendHint       (socket)
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

		sendHint: (socket) => {
			socket.emit('ThisIsTheHint', {
				hint: room.hint
			})
		},

		getPlayersList: () => {
			return Object.values(room.socketList).map(socket=>({
					name: socket.playerName,
					color: socket.playerColor,
					score: socket.score,
					scoreDelta: socket.scoreDelta,
					hasPlayed: room.hasPlayed(socket),
					id: socket.id
			}))
		},

		computeScoreNewPlayer: () => {
			if (room.getNbOfPlayers() <= 1)
				return 0
			else {
				let minScore = 1000000
				applyToAllSockets(room.socketList, (socket) => {
					if (socket.score < minScore)
						minScore = socket.score
				})
				for (score of Object.values(room.scoresOfPlayersWhoLeftRecently)) {
					if (score < minScore)
						minScore = score
				}
				return minScore
			}
		},

		onPlayerArrival: (socket) => {
			room.playersWhoConnected += socket.playerName + '\n'
			// -------- ID --------
			room.socketList[socket.id] = socket
			socket.emit('ThisIsYourID', {id: socket.id})
			socket.emit('ThisIsRoomID', {id: room.id})

			// -------- PLAYER --------
			socket.playerName = socket.playerName || 'myName'
			socket.playerColor = randomColor()
			applyToAllSockets(room.socketList, room.sendPlayersList)
			socket.score = room.computeScoreNewPlayer()
			socket.scoreDelta = 0

			setSelectedCardInHand(socket, null)
			setSelectedCardAtPlay(socket, null)

			// -------- NAME --------
			socket.on('ThisIsMyName', data => {
				socket.playerName = escapeHtml(data.name)
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
				const index = data.cardIndex
				if (typeof index === "number" && index >= 0 && index < NB_CARDS_PER_HAND || index === null) {
					room.getGamePhase().onSelectedCardInHandChanged(socket, index)
					applyToAllSockets(room.socketList, room.sendPlayersList)
				}
			})

			socket.on('SelectedCardAtPlayChanged', (data) => {
				const index = data.cardIndex
				if (typeof index === "number" && index >= 0 && index < room.cardsAtPlayAndTheirPlayers.length || index === null) {
					room.getGamePhase().onSelectedCardAtPlayChanged(socket, index)
					applyToAllSockets(room.socketList, room.sendPlayersList)
				}
			})

			// -------- HINT --------

			socket.on('ThisIsTheHint', (data) => {
				room.hint = escapeHtml(data.hint)
				applyToAllSockets(room.socketList, room.sendHint)
			})

			// -------- ON DISCONNECT --------
			socket.on('disconnect', () => {
				// Put cards back in the deck
				socket.hand.reverse().forEach( card => room.deck.unshift(card) )
				// Store score to avoid cheats
				room.scoresOfPlayersWhoLeftRecently[socket.id] = socket.score
				setTimeout( () => { 
					if (room.scoresOfPlayersWhoLeftRecently[socket.id])
						delete room.scoresOfPlayersWhoLeftRecently[socket.id]
				}, 60 * 1000)
				//
				const id = socket.id
				const wasGameMaster = id === room.gameMasterID()
				delete room.socketList[socket.id]
				if (room.getNbOfPlayers() === 0) {
					//if (process.env.DEBUG !== 'true')
						sendGameReport(room.playersWhoConnected, room.dateBegin)
					delete roomsList[room.id]
				}
				else {
					applyToAllSockets(room.socketList, room.sendPlayersList)
					if (wasGameMaster && room.gamePhaseIndex < 3) {
						room.gameMasterIndex -= 1
						room.gamePhaseIndex = 3
						room.resetSelectedCards()
						room.moveToNextPhase()
					}
					else {
						room.getGamePhase().checkForEndOfPhase()
					}
				}
			})
		},

		initializeDeck: async () => {
			// let biggestCard
			// JPG / PNG images
			const fixedImgDir = path.join(__dirname, 'client/cards/originalCards')
			fs.readdirSync(fixedImgDir).forEach(function (file) {
		        room.deck.push({
					generationMethod: 0,
					fileFolder: 'originalCards',
					fileName: file,
				})
				// if (file == '191.jpg')
				// 	biggestCard = room.deck[room.deck.length-1]
			})
			// Read custom cards from database
			// let myyCard
			// let myyCard2
			await dbRequest( async db => {
				try {
					const cards = await db.collection('cards').find({}).toArray()
					const authors = await db.collection('authors').find({}).toArray()
					cards.forEach( cardDB => {
						const author = authors.find(author => {
							return author._id.toString() === cardDB.authorID
						})
						const cardObj = {
							generationMethod: cardDB.generationMethod,
							linkToGalery: 'https://julesfouchy.github.io/DixImacGallery/?cardid=' + cardDB._id,
							authorName: author.name,
							authorLink: author.link,
						}
						if (cardDB.generationMethod === 0) {
							cardObj.fileFolder = cardDB.fileFolder
							cardObj.fileName = cardDB.fileName
						}
						if (cardDB.generationMethod === 1) {
							cardObj.sourceCode = fs.readFileSync(path.join(__dirname, 'client/cards/', cardDB.fileFolder, cardDB.fileName), 'utf8')
							cardObj.seed = Math.floor(1000000*Math.random())
						}
						if (cardDB.generationMethod === 2) {
							cardObj.sourceCode = fs.readFileSync(path.join(__dirname, 'client/cards/', cardDB.fileFolder, cardDB.fileName), 'utf8')
							cardObj.seed = Math.random()
						}
						room.deck.push(cardObj)
						// if (cardDB._id =='5eb58550a7587722fca1c08f')
						// 	myyCard = cardObj
						// if (cardDB._id =='5eb585a92cc6b815b0960798')
						// 	myyCard2 = cardObj
					})
				}
				catch (err) {
					console.log('Error while connecting to database to create deck')
					console.log(err)
				}
			})
			// Shuffle
			room.deck = shuffle(room.deck)
			// room.deck[0] = myyCard
			// room.deck[1] = biggestCard
			// room.deck[2] = myyCard2
		}
	}
	room.gamePhases = [
			room.gpGAME_MASTER_PICKING_A_CARD,
			room.gpOTHER_PLAYERS_PICKING_A_CARD,
			room.gpVOTING_FOR_A_CARD,
			room.gpVIEWING_VOTES
	]
	await room.initializeDeck()
	roomsList[id] = room
	return id
}

const joinRoom = (socket, roomID) => {
	if (roomsList[roomID]) {
		roomsList[roomID].onPlayerArrival(socket)
		socket.removeAllListeners('CreateRoom')
		socket.removeAllListeners('JoinRoom')
	}
	else
		console.log('No room with this ID : ' + roomID)
}

io.sockets.on('connection', socket => {
	socket.on('ThisIsMyName', data => {
		socket.playerName = escapeHtml(data.name)
	})
	socket.on('CreateRoom', async () => {
		const roomID = await createRoom()
		joinRoom(socket, roomID)
	})

	socket.on('JoinRoom', (data) => {
		joinRoom(socket, data.roomID)
	})
	// setTimeout(() => {
	// 	if (Object.values(roomsList).length === 0) {
	// 		const roomID = createRoom()
	// 		joinRoom(socket, roomID)
	// 	}
	// 	else {
	// 		joinRoom(socket, Object.values(roomsList)[0].id)
	// 	}
	// }, 1000)
})

const sendGameReport = (playersList, dateBegin) => {
    const transporter = nodemailer.createTransport({
        host: 'smtp.zoho.com',
        port: 465,
        secure: true, // use SSL
        auth: {
			user: process.env.MAIL_ADDR,
			pass: process.env.MAIL_PASSWORD
        }
    })
    
	const duration = Math.floor(((new Date()).getTime() - dateBegin.getTime()) / 1000)
    const gameDurationTxt = Math.floor(duration / 60) + ' min ' + (duration % 60) + ' sec'
    
    const mailOptions = {
        from: process.env.MAIL_ADDR,
        to: process.env.MAIL_ADDR,
        subject: 'Another Game !',
		text: 'Played for ' + gameDurationTxt + '\n' + playersList,
    };
    
    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            return console.log(error);
        }
    
        console.log('Message sent: ' + info.response);
    })
}