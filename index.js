const express = require('express');
const app = express();
app.use(express.static("./"));
const http = require('http');
const server = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(server);

//https://glitch.com/edit/#!/simple-multiplayer-server?path=server.js%3A78%3A0

const players = {};

var playerList = [];
var playerName = [];

var numOfPlayers = 0;

var testNames = ["Dave", "Steve", "Ted", "Jay", "Danny", "xCoolGuy", "Poopy Boy", "Stoopy Poopy", "SloopyPooButt", "Ronnie", "Donnie", "Scone", "Drone", "Troned", "Spooniemo"];

//var board = new Array(16).fill('0x000000').map(() => new Array(16).fill('0x000000'));
function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '0x';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

var board = new Array(16);
for (let i = 0; i < 16; i++){
    board[i] = new Array(16);
}

function setBoardColor(){
  for(let i = 0; i < 16; i++){
    for(let j = 0; j < 16; j++){
        //THIS IS WHERE WE SET THE BOARD COLOR
        //Maybe alternate color?
        if((i+j)%2 == 0) {
          board[i][j] = '0xEFEFEF';
        }else{
          board[i][j] = '0xFFFFFF';
        }

      }
  }
}
setBoardColor();

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
	console.log('a user', socket.id,  'connnected');
  numOfPlayers++;

  playerList.push(socket.id);

  var tempName = testNames[Math.floor(Math.random()*testNames.length)];
  playerName.push(tempName);

  io.emit("board init", board);

  io.emit("init", numOfPlayers, playerList, playerName, getRandomColor());

  io.emit("sync players", playerList, playerName);

  io.emit("reclog", '0xffbf36', tempName + " connected!");

  socket.on("name change", (name)=>{
      let index = playerList.indexOf(socket.id);
      playerName[index] = name;
      io.emit("sync players", playerList, playerName)
  });
	
  socket.on("reset", ()=>{
    setBoardColor()
    io.emit("board reset", board)
  });

  socket.on("sendmsg", (msg, clr)=>{
    let index = playerList.indexOf(socket.id);
    
    io.emit("recmsg", clr, playerName[index], msg);
  });

	socket.on('disconnect', () => {
      numOfPlayers--;
      let index = playerList.indexOf(socket.id);
      playerList.splice(index, 1);
      playerName.splice(index, 1);

      io.emit("reclog", '0xfc5b35', playerName + " disconnected.");
      io.emit("remove player", playerList, playerName);
    	console.log('user', socket.id, 'disconnected');
    	stateChanged = true;
    	delete players[socket.id];
  	});

  	socket.on('board update', (brd, i, j) => {
  		board[i][j] = brd[i][j];
      /*
  		for(let i = 0; i < 16; i++){
            for(let j = 0; j < 16; j++){
                board[i][j] = brd[i][j];
            }
        }*/

    	io.emit('board update', board, i,j);
  	});

});

server.listen(3000, () =>{
	console.log('listening on *:3000');
});