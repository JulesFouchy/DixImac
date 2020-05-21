const socket = io()

let myRoomID = null

const onMyNameChange = (newName) => {
	socket.emit('ThisIsMyName', {
		name: newName
	})
	draw()
}

socket.on('ThisIsRoomID', data => {
	myRoomID = data.id
	loadGamePage()
})