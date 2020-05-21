const emitCreateRoom = () => socket.emit('CreateRoom')

const joinRoom = () => {
    const roomID = document.getElementById("roomToJoinID").value
    socket.emit('JoinRoom', { roomID })
}