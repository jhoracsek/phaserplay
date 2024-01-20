const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(server);

//https://glitch.com/edit/#!/simple-multiplayer-server?path=server.js%3A78%3A0

const players = {};

var numOfPlayers = 0;

//var board = new Array(16).fill('0x000000').map(() => new Array(16).fill('0x000000'));
var board = new Array(16);
for (let i = 0; i < 16; i++){
    board[i] = new Array(16);
}
for(let i = 0; i < 16; i++){
    for(let j = 0; j < 16; j++){
        board[i][j] = '0x111111';
    }
}

var data = "poopy butt hole";

const createPlayer = (id, color) => ({
  id,
  color,
});

function numPlayers() {
  return Object.keys(players).length;
}

// Tracking variables for the update loop
let stateChanged = false;
let isEmittingUpdates = false;
const stateUpdateInterval = 300;


function emitStateUpdateLoop() {
  isEmittingUpdates = true;
  // Reduce usage by only send state update if state has changed
  if (stateChanged) {
    stateChanged = false;
    io.emit("stateUpdate", players);
  }

  if (numPlayers() > 0) {
    setTimeout(emitStateUpdateLoop, stateUpdateInterval);
  } else {
    // Stop the setTimeout loop if there are no players left
    isEmittingUpdates = false;
  }
}


app.get('/', (req, res)=>{
	res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
	console.log('a user connnected');
  numOfPlayers++;

  io.emit("board update", board);

  io.emit("init", numOfPlayers);

  console.log(socket.id);
	
	socket.on('disconnect', () => {
      numOfPlayers--;
    	console.log('user disconnected');
    	stateChanged = true;
    	delete players[socket.id]
  	});

  	socket.on('board update', (brd) => {
  		
  		for(let i = 0; i < 16; i++){
            for(let j = 0; j < 16; j++){
                board[i][j] = brd[i][j];
            }
        }

    	io.emit('board update', board);
  	});

    /*
  	socket.on("initialize", function(data) {
	    stateChanged = true;
	    var id = socket.id;

	    var newPlayer = createPlayer(id, data.color);
	    players[id] = newPlayer;

	    //On first player joined, start update emit loop
	    if (numPlayers() === 1 && !isEmittingUpdates) {
	      emitStateUpdateLoop();
	    }
  });*/
});

server.listen(3000, () =>{
	console.log('listening on *:3000');
});

//==========

/*
io.sockets.on("connection", function(socket) {
  socket.on("disconnect", function() {
    // Remove player from state on disconnect
    stateChanged = true;
    delete players[socket.id];
  });

  socket.on("positionUpdate", function(positionData) {
    stateChanged = true;
    let player = players[socket.id];
    player.position = positionData;
  });

  
});

console.log("Server started.");
server.listen(3000);


*/