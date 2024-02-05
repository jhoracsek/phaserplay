const express = require('express');
const app = express();
app.use(express.static("./"));
const http = require('http');
const server = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(server);

var playerList = [];
var playerName = [];

var numOfPlayers = 0;

var testNames = ["Dave", "Steve", "Ted", "Jay", "Danny", "xCoolGuy", "Poopy Boy", "Stoopy Poopy", "SloopyPooButt", "Ronnie", "Donnie", "Scone", "Drone", "Troned", "Spooniemo"];

// HELPER FUNCTIONS =================================================

function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '0x';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
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

//===================================================================


// BOARD INIT =======================================================

var board = new Array(16);
for (let i = 0; i < 16; i++){
    board[i] = new Array(16);
}
setBoardColor();

//===================================================================

app.get('/', (req, res)=>{
	res.sendFile(__dirname + '/index.html');
});



io.on('connection', (socket) => {

  // ON PLAYER CONNECT =================================================
	console.log('a user', socket.id,  'connnected');
  numOfPlayers++;

  playerList.push(socket.id);

  var tempName = testNames[Math.floor(Math.random()*testNames.length)];
  playerName.push(tempName);

  io.emit("board init", board);

  io.emit("init", numOfPlayers, playerList, playerName, getRandomColor());

  io.emit("sync players", playerList, playerName);

  io.emit("reclog", '0xffbf36', tempName + " connected!");

  //===================================================================

  socket.on("name change", (name)=>{
      let index = playerList.indexOf(socket.id);
      playerName[index] = name;
      io.emit("sync players", playerList, playerName)
  });
	
  socket.on("reset", ()=>{
    setBoardColor();
    io.emit("board reset", board);
  });

  socket.on("sendmsg", (msg, clr)=>{
    let index = playerList.indexOf(socket.id);
    io.emit("recmsg", clr, playerName[index], msg);
  });

  socket.on('board update', (cell, i, j) => {
      board[i][j] = cell;
      io.emit('board update', cell, i,j);
  });


  // ON PLAYER DISCONNECT =================================================
	socket.on('disconnect', () => {
      socket.emit("disc");
      numOfPlayers--;
      let index = playerList.indexOf(socket.id);
      playerList.splice(index, 1);
      playerName.splice(index, 1);


      io.emit("reclog", '0xfc5b35', playerName + " disconnected.");
      io.emit("remove player", playerList, playerName);
    	console.log('user', socket.id, 'disconnected');
  	});
  // =======================================================================



});



server.listen(3000, () =>{
	console.log('listening on *:3000');
});