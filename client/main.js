const emitCreateRoom = () => socket.emit('CreateRoom')
const joinRoom = () => {
    const roomID = document.getElementById("roomToJoinID").value
    socket.emit('JoinRoom', { roomID })
}

const drawRoomInfo = () => {
    const htmlEl = document.getElementById("roomSelection")
    if (myRoomID) {
        //htmlEl.innerHTML = '<p> You are in room ' + myRoomID + '</p>'
    }
    else {
        htmlEl.innerHTML =
            '<div class="input-group" ><input class="form-control" type="text" value="" id="roomToJoinID" placeholder="Enter room number" ><div class="input-group-append"><button type = "submit" class="btn btn-secondary" onclick= joinRoom() >GO</button ></div></div>'
        +'<label for="buttonCreateARoom">or</label>' + '<div><button type="submit" class="btn btn-secondary w-100" id="buttonCreateARoom" onclick="emitCreateRoom()">Create a Room</button><div>'
    }
}



