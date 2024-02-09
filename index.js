const express = require('express');
const app = express();
app.use(express.static("./"));
const http = require('http');
const server = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(server);



//THESE SHOULD ALL BE ABLE TO BE REMOVED....
//var playerList = [];
//var playerName = [];

var numOfPlayers = 0;

var testNames = ["Dave", "Steve", "Ted", "Jay", "Danny", "xCoolGuy", "Poopy Boy", "Stoopy Poopy", "SloopyPooButt", "Ronnie", "Donnie", "Scone", "Drone", "Troned", "Spooniemo"];



// ROOM SETUP STUFF =================================================
//This seems sufficient, I doubt there would ever be larger than 10067 concurrent servers...
//These are also specifically PRIVATE ROOMS... There should be another array for public rooms.
//Actually makes more sense for this to be ALL rooms. There is just a flag if it's private or not
var rooms = new Array(10067);

class Room{
  constructor(roomID){
    this.roomID = roomID;
    this.playerList = [];
    this.playerName = [];
    this.numOfPlayers = 0;
    this.board = new Array(16);

    for (let i = 0; i < 16; i++){
      this.board[i] = new Array(16);
    }
    this.setBoardColor();

    this.private = true;
    this.maxPlayers = 4;

    //This will be our flag if the game has started or not.
    this.canJoin = true;
    
  }

  isFull(){
    if(this.numOfPlayers >= 4)
      return true;
    return false;
  }


  setBoardColor(){
    for(let i = 0; i < 16; i++){
      for(let j = 0; j < 16; j++){
        if((i+j)%2 == 0) {
          this.board[i][j] = '0xEFEFEF';
        }else{
          this.board[i][j] = '0xFFFFFF';
        }
      }
    }
  }
}

/*
  Returns the room object from the array rooms
*/
function getRoomObj(roomID){

  let ind = hash(roomID);
  if(rooms[ind] != null){
    for(let i = 0; i < rooms[ind].length; i++){
      if(roomID == rooms[ind][i].roomID){
        return rooms[ind][i];
      }
    }
  }
  //Cannot find a room object associated with this roomID, so return null
  return null;
}

/*
  
*/
function generateNewRoom(){
  var unique = true;
  var retRoomID = "";
  do{
    unique = true;
    let roomID = generateRoomID();
    let ind = hash(roomID);
    //We need to make sure rooms[ind] is an array
    if(rooms[ind] == null){
      //Wow we love this idea
      rooms[ind] = [new Room(roomID)]
    }else{
      //This is the situation where either:
      //(a) We have a collision where every ID in rooms[ind] is unique from the current "roomID"
      //(b) We have a collision where there is an index j such that rooms[ind][j].roomID == roomID
      //In case (b) we need to restart the function with a new roomID. (So this should all be contained in a while loop)
      for(let j = 0; j < rooms[ind].length; j++){
        //Oh no, we have to regenerate the ID :(
        //Statistically this is extremely unlikely to happen...
        if(rooms[ind][j].roomID == roomID){
          unique = false;
          break;
        }
      }
      if (unique){
        rooms[ind].push(new Room(roomID));
      }
    }
    retRoomID = roomID;
  }while(!unique);
  return retRoomID;
}

//====================================================================

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

function randInt(min, max) {
  return Math.floor(Math.random() * ((max+1) - min) ) + min;
}

function generateRoomID(){
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz'
  let ret = ""
  for(let i = 0; i < 5; i++){
    ret+=chars[randInt(0,35)]
  }
  return ret;
}
/*
  https://stackoverflow.com/questions/6122571/simple-non-secure-hash-function-for-javascript
  Nice implementation of Javas built in method for hashing strings :D
*/
function hash(roomID){
  let hash = 0;
    for (let i = 0, len = roomID.length; i < len; i++) {
        let chr = roomID.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash%10067;
}

const plrMap = new Map();
function getRoomFrmSock(socketID){

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
  //All the stuff below should just happen when a player enters a room.
  // ON PLAYER CONNECT =================================================
	console.log('a user', socket.id,  'connnected');
  numOfPlayers++;

  socket.on("requestToJoinRoom", (rmid)=>{
    //this is a socket.emit because you're just sending this back to the guy...
    let roomobject = getRoomObj(rmid);
    //Create unique room id.
    console.log(roomobject.numOfPlayers)
    if(roomobject == null){
      socket.emit("badRequest", "Room does not exist!");
    //These shoudl be functions that update dynamically!
    }else if(!roomobject.canJoin){
      socket.emit("badRequest", "Game is already in progress!");
    }else if(roomobject.isFull()){
      socket.emit("badRequest", "Room is full!");
    }
    else{
      socket.emit("sendRoomID", (rmid));
    }
  });

  socket.on("requestRoomID", ()=>{
    //this is a socket.emit because you're just sending this back to the guy...
    
    //Create unique room id.
    let roomID = generateNewRoom();
    socket.emit("sendRoomID", (roomID));

  });

  socket.on("connectToRoom", (plrRoomID, myName)=>{
    //So here we have both the players roomID and their socket
    //Need to get room object...
    socket.join(plrRoomID);

    plrMap.set(socket.id, plrRoomID);

    console.log(plrRoomID);

    let roomObject = getRoomObj(plrRoomID);

    roomObject.numOfPlayers = roomObject.numOfPlayers + 1;

    roomObject.playerList.push(socket.id);
    var tempName = "";
    if(myName == ""){
      tempName = testNames[Math.floor(Math.random()*testNames.length)];
    }else{tempName=myName;}
    roomObject.playerName.push(tempName);

    io.to(plrRoomID).emit("board init", roomObject.board);

    io.to(plrRoomID).emit("init", roomObject.numOfPlayers, roomObject.playerList, roomObject.playerName, getRandomColor());

    io.to(plrRoomID).emit("sync players", roomObject.playerList, roomObject.playerName);


    //Needs tp ja pahppen befre this one
    io.to(plrRoomID).emit("reclog", '0xffbf36', tempName + " connected!");

    //===================================================================
  });


  socket.on("name change", (name,plrRoomID)=>{
      let roomObject = getRoomObj(plrRoomID);

      let index = roomObject.playerList.indexOf(socket.id);
      roomObject.playerName[index] = name;
      io.to(plrRoomID).emit("sync players", roomObject.playerList, roomObject.playerName)
  });
  

  socket.on("reset", (plrRoomID)=>{
    let roomObject = getRoomObj(plrRoomID);

    setBoardColor();
    io.to(plrRoomID).emit("board reset", roomObject.board);
  });

  socket.on("sendmsg", (msg, clr,plrRoomID)=>{
    let roomObject = getRoomObj(plrRoomID);

    let index = roomObject.playerList.indexOf(socket.id);
    io.to(plrRoomID).emit("recmsg", clr, roomObject.playerName[index], msg);
  });

  socket.on('board update', (cell, i, j,plrRoomID) => {
      let roomObject = getRoomObj(plrRoomID);

      roomObject.board[i][j] = cell;
      io.to(plrRoomID).emit('board update', cell, i,j);
  });

  socket.on('start game', (plrRoomID) => {
    let roomObject = getRoomObj(plrRoomID);
      io.to(plrRoomID).emit('start game');
      roomObject.canJoin = false;
      //WE SHOULD ALSO NOT ALLOW PEOPLE TO ENTER THE ROOM ANYMORE AT THIS POINT!!!!!
  });
  

  




  // PLAYER DISCONNECT =================================================
  

	socket.on('disconnect', () => {
      let plrRoomID = plrMap.get(socket.id);
      if(plrRoomID != null){
        let roomObject = getRoomObj(plrRoomID);
        console.log("RARW" + plrRoomID);
        socket.emit("disc");
        roomObject.numOfPlayers--;
        let index = roomObject.playerList.indexOf(socket.id);
        roomObject.playerList.splice(index, 1);
        roomObject.playerName.splice(index, 1);


        io.to(plrRoomID).emit("reclog", '0xfc5b35', roomObject.playerName + " disconnected.");
        io.to(plrRoomID).emit("remove player", roomObject.playerList, roomObject.playerName);
      	//console.log('user', socket.id, 'disconnected');

        //IF YOU'RE THE LAST FUCKING BRUH IN THE ROOM THEN THE FUCKING ROOM SHOULD BE 
        //DELETED IF YOU FUCKING DISCONECT IT'S NOT FUCKING ROCKET SCIENCE
      }
  	});
  // =======================================================================



});



server.listen(3000, () =>{
	console.log('listening on *:3000');
});