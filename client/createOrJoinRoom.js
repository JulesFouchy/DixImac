const emitCreateRoom = () => {
    socket.emit('CreateRoom')
    socket.emit('ThisIsMyName', {
		name: document.getElementById('pseudo-input').value || 'myName'
	})
}

const joinRoom = () => {
    const roomID = document.getElementById("roomToJoinID").value
    socket.emit('JoinRoom', { roomID })
    socket.emit('ThisIsMyName', {
		name: document.getElementById('pseudo-input').value || 'myName'
	})
}