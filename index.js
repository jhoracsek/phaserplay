const express = require('express');
const app = express();
app.use(express.static("./"));
const http = require('http');
const https = require('https');
const server = http.createServer(app);
//const serverHttps = https.createServer(app);

const { Server } = require("socket.io");
const io = new Server(server);

var numOfPlayers = 0;
const plrMap = new Map();
var testNames = ["Dave", "Steve", "Ted", "Jay", "Danny", "xCoolGuy", "Poopy Boy", "Stoopy Poopy", "SloopyPooButt", "Ronnie", "Donnie", "Scone", "Drone", "Troned", "Spooniemo"];

//This seems sufficient, I doubt there would ever be larger than 10067 concurrent servers...
var rooms = new Array(10067);

class PriorityQueue {
  constructor() {
    this.queue = [];
  }

  enqueue(element, priority) {
    this.queue.push({ element, priority });
    this.sortQueue();
  }

  dequeue() {
    if (this.isEmpty()) {
      return "Queue is empty";
    }
    return this.queue.shift().element;
  }

  front() {
    if (this.isEmpty()) {
      return "Queue is empty";
    }
    return this.queue[0].element;
  }

  isEmpty() {
    return this.queue.length === 0;
  }

  get(index){
    return this.queue[index].element;
  }

  length(){
    return this.queue.length;
  }

  sortQueue() {
    this.queue.sort((a, b) => b.priority - a.priority);
  }
}

function priOffset(){
  return 0.5 + Math.random() * 0.5;
  //return 1;
}

class Room{
  constructor(roomID){
    this.roomID = roomID;
    this.playerList = [];
    this.ogList = [];
    this.ogNames = [];
    this.playerName = [];

    //Number of players actively connected
    this.numOfPlayers = 0;
    //Number of players connected at game start
    this.numPlayersAtStart = 0;
    
    this.board = new Array(16);

    for (let i = 0; i < 16; i++){
      this.board[i] = new Array(16);
    }
    this.setBoardColor();

    this.private = true;
    this.maxPlayers = 4;

    //This will be our flag if the game has started or not.
    this.canJoin = true;

    this.clrMap = new Map();
    this.isAi = [];
    this.hasLost = [];

    this.currentTurn = -1;
    this.gameStarted = false;

    this.colourList = [];

    this.placed = new Array(4);

  }

  isFull(){
    if(this.numOfPlayers >= 4)
      return true;
    return false;
  }

  checkWinCondition(){
    let n = this.hasLost.length;
    var count = 0;
    for(let i = 0; i < n; i++){
      if(!this.hasLost[i])
        count++
    }

    if(count <= 1){
      return true;
    }

    return false;

  }

  getWinner(){
    let n = this.hasLost.length;
    for(let i = 0; i < n; i++){
      if(!this.hasLost[i])
        return [this.playerName[i], this.colourList[i]];
    }
    return null;
  }

  /*
    Here we store all the custom "maps". 
    The function will return the locations for a random map.
    One day, I would love user created maps.
  */
  getMap(){
    //MAP 1
    let map1 = [ [] ]

    //MAP 2
    let map2 = [ [2,1],[1,2], [13,1],[14,2],  [1,13],[2,14],  [13,14],[14,13] ];
    let map3 = [ [2,1],[1,2], [13,1],[14,2],  [1,13],[2,14],  [13,14],[14,13], [7,7],[7,8],[8,7],[8,8] ];
    let map4 = [ [0,7],[2,7],[3,7],[4,7],[5,7],[6,7],[7,7], [8,8],[9,8],[10,8],[11,8],[12,8],[13,8],[15,8]  ];
    return map4;
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
    //Now apply the map...
    let map = this.getMap();
    let n = map.length;
    for(let i = 0; i < n; i++)
      this.board[map[i][0]][map[i][1]] = '0xFF0000';
  }

  //socket.id is mapped to player colour
  getPlayerColour(sock){
    return this.clrMap.get(sock);
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

function generateNewRoom(){
  var unique = true;
  var retRoomID = "";
  do{
    unique = true;
    let roomID = generateRoomID();
    let ind = hash(roomID);
    //We need to make sure rooms[ind] is an array
    if(rooms[ind] == null){
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

function getStartCoord(plrNum){
  switch(plrNum){
    case 0:
      return [1,1];
    case 1:
      return [14,14];
    case 2:
      return [14,1];
    //Case 3
    default:
      return [1,14];
  }
}

//Min and max inclusive
function randInt(min, max) {
  return Math.floor(Math.random() * ((max+1) - min) ) + min;
}

function adjHeur(gameBoard, x,y,clr){
  //clr is my color. So if you see a different color that's good.
  var adj = 0;
  if (x > 0){
    if(gameBoard[x-1][y] != '0xEFEFEF' && gameBoard[x-1][y] != '0xFFFFFF' && gameBoard[x-1][y] != '0xFF0000' && gameBoard[x-1][y] != clr)
      adj++;
  }
  if(x < 15){
    if(gameBoard[x+1][y] != '0xEFEFEF' && gameBoard[x+1][y] != '0xFFFFFF' && gameBoard[x+1][y] != '0xFF0000'&& gameBoard[x+1][y] != clr)
      adj++; 
  }
  if(y > 0){
    if(gameBoard[x][y-1] != '0xEFEFEF' && gameBoard[x][y-1] != '0xFFFFFF' && gameBoard[x][y-1] != '0xFF0000'&& gameBoard[x][y-1] != clr)
      adj++; 
  }

  if(y < 15){
    if(gameBoard[x][y+1] != '0xEFEFEF' && gameBoard[x][y+1] != '0xFFFFFF' && gameBoard[x][y+1] != '0xFF0000'&& gameBoard[x][y+1] != clr)
      adj++; 
  }

  switch(adj){
    case 1:
      return 4;
    case 2:
      return 3;
    case 3:
      return 2;
    default:
      return 0;
  }

}

function heuristic(val){
  switch(val){
    case 0:
      return 0.3;
    case 1:
      return 0.4;
    case 2:
      return 0.5;
    case 3:
      return 0.6;
    case 4:
      return 0.7;
    case 5:
      return 0.8;
    case 6:
      return 1.0;
    case 7:
      return 1.2;
    case 8:
      return 1.2;
    case 9:
      return 1.0;
    case 10:
      return 0.8;
    case 11:
      return 0.7;
    case 12:
      return 0.6;
    case 13:
      return 0.5;
    case 14:
      return 0.4;
    case 15:
      return 0.3;
    default:
      return 0;
  }
}
function getMaxIndex(arr) {
    let max = -Infinity;
    let maxIndices = [];
    
    // Find the maximum value and its indices
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] > max) {
            max = arr[i];
            maxIndices = [i];
        } else if (arr[i] === max) {
            maxIndices.push(i);
        }
    }

    // If there are ties, randomly select one of the tied indices
    if (maxIndices.length > 1) {
        return maxIndices[Math.floor(Math.random() * maxIndices.length)];
    } else {
        return maxIndices[0];
    }
}

/*
  This (in conjunction with the heurstic above) is basically the AI
  Returns a valid tile that we can place based on
  (1) Which tiles have already been placed
  (2) The existing board
  If no tiles can be placed, it should return null.
*/
function validTile(gameBoard, placed, clr){
  let n = placed.length();
  //The "placed" list should be sorted so max priority tiles are first.
  for(let i = 0; i < n; i++){
    let x = placed.get(i)[0];
    let y = placed.get(i)[1];
    //Just add them to the candidates then choose a random candidate.
    //Yeah this is a dirty implementation... should be fixed
    var candidates=[];
    var pri=[];
    if(x > 0 && (gameBoard[x-1][y] == '0xEFEFEF' || gameBoard[x-1][y] == '0xFFFFFF')){
        candidates.push([x-1,y]);
        pri.push(   (heuristic(x-1)*heuristic(y) + adjHeur(gameBoard, x-1, y, clr))*priOffset()   );
    }
    
    if(x < 15 && (gameBoard[x+1][y] == '0xEFEFEF' || gameBoard[x+1][y] == '0xFFFFFF')){
        candidates.push([x+1,y]);
        pri.push(   (heuristic(x+1)*heuristic(y)+ adjHeur(gameBoard, x+1, y, clr))*priOffset()   );
    }
    if(y > 0 && (gameBoard[x][y-1] == '0xEFEFEF' || gameBoard[x][y-1] == '0xFFFFFF')){
        candidates.push([x,y-1]);
        pri.push(   (heuristic(x)*heuristic(y-1)+ adjHeur(gameBoard, x, y-1, clr))*priOffset()   );
    }
    if(y < 15 && (gameBoard[x][y+1] == '0xEFEFEF' || gameBoard[x][y+1] == '0xFFFFFF')){
        candidates.push([x,y+1]);
        pri.push(   (heuristic(x)*heuristic(y+1)+ adjHeur(gameBoard, x, y+1, clr))*priOffset()   );
    }
    if(candidates.length > 0){
      //choose a random candidate
      const maxIndex = getMaxIndex(pri);
      return candidates[maxIndex];
    }
  }
  return null;
}



function getRandNum(){
  var rand = Math.random();

  if(rand < 0.10){
    return 3;
  }
  if(rand < 0.25){
    return 4;
  }
  if(rand < 0.5){
    return 5;
  }
  if(rand > 0.90){
    return 8;
  }
  if(rand > 0.75){
    return 7;
  }
  if(rand >= 0.5){
    return 6;
  }
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



//===================================================================


// BOARD INIT =======================================================

var board = new Array(16);
for (let i = 0; i < 16; i++){
    board[i] = new Array(16);
}
setBoardColor();

//===================================================================


/*
  Handles AI's moves.
*/
function aiMove(roomObject, plrRoomID, nextTurn, numPlrs, numICanPlace){
  var cell = roomObject.colourList[nextTurn];
  var z = 0;
  
  function timedLoop(){
    if(z < numICanPlace){
      var tile = validTile(roomObject.board, roomObject.placed[nextTurn], roomObject.colourList[nextTurn]);
      if(tile != null){ 

        roomObject.placed[nextTurn].enqueue(tile, (heuristic(tile[0])*heuristic(tile[1]) + adjHeur(roomObject.board, tile[0], tile[1], roomObject.colourList[nextTurn]))*priOffset());
        roomObject.board[tile[0]][tile[1]] = cell;

        io.to(plrRoomID).emit('board update', cell, tile[0],tile[1]);
      }else{
        let plrNum = nextTurn;
        roomObject.hasLost[plrNum] = true;
      
        clearInterval(interval);
        numICanPlace = getRandNum();
        for(let i = 0; i < numPlrs; i++){
          let nextPotentialTurn =(nextTurn+1+i)%numPlrs; 
          if (roomObject.hasLost[nextPotentialTurn] == false){
            nextTurn = nextPotentialTurn;
            break;
          }
        }
        roomObject.currentTurn = nextTurn;
        io.to(plrRoomID).emit("reclog", '0xABCDEF', roomObject.ogNames[plrNum] + " is out!");
        if(roomObject.checkWinCondition()){
          io.to(plrRoomID).emit("reclog", '0x00EE00', roomObject.ogNames[nextTurn] + " is the winner!");

          //Maybe also pass the winning players name here??
          io.to(plrRoomID).emit('game over', roomObject.getWinner()[0], roomObject.getWinner()[1]);
        }else{
          io.to(plrRoomID).emit('new turn', nextTurn,roomObject.playerName[nextTurn], numICanPlace);
          if(roomObject.isAi[nextTurn]){
            aiMove(roomObject, plrRoomID, nextTurn, numPlrs, numICanPlace);
          }
        }
      }
      z++;
    }else{
      //Loop is over so end it.
      clearInterval(interval);

      numICanPlace = getRandNum();
      for(let i = 0; i < numPlrs; i++){
        let nextPotentialTurn =(nextTurn+1+i)%numPlrs; 
        if (roomObject.hasLost[nextPotentialTurn] == false){
          nextTurn = nextPotentialTurn;
          break;
        }
      }
      roomObject.currentTurn = nextTurn;

      io.to(plrRoomID).emit('new turn', nextTurn,roomObject.playerName[nextTurn], numICanPlace);

      //If the next player is an AI, need to take the turn.
      if(roomObject.isAi[nextTurn]){
        aiMove(roomObject, plrRoomID, nextTurn, numPlrs, numICanPlace);
      }
    }
  }
  const interval = setInterval(timedLoop, 350);
  
}

app.get('/', (req, res)=>{
	res.sendFile(__dirname + '/index.html');
});


setInterval(()=>{
    io.emit("tick");
  }, 1000)

io.on('connection', (socket) => {
  // ON PLAYER CONNECT =================================================
	console.log('a user', socket.id,  'connnected');
  numOfPlayers++;

  socket.on("requestToJoinRoom", (rmid)=>{
    let roomobject = getRoomObj(rmid);

    if(roomobject == null){
      socket.emit("badRequest", "Room does not exist!");
    }
    else if(!roomobject.canJoin){
      socket.emit("badRequest", "Game is already in progress!");
    }
    else if(roomobject.isFull()){
      socket.emit("badRequest", "Room is full!");
    }
    else{
      socket.emit("sendRoomID", (rmid));
    }
  });

  socket.on("requestRoomID", ()=>{
    //Create unique room id.
    let roomID = generateNewRoom();
    socket.emit("sendRoomID", (roomID));

  });

  socket.on("requestRoomID2", ()=>{
    //Create unique room id.
    let roomID = generateNewRoom();
    socket.emit("sendRoomID2", (roomID));

  });

  socket.on("requestRoomID3", ()=>{
    //Create unique room id.
    let roomID = generateNewRoom();
    socket.emit("sendRoomID3", (roomID));

  });

  socket.on("requestRoomID4", ()=>{
    //Create unique room id.
    let roomID = generateNewRoom();
    socket.emit("sendRoomID4", (roomID));

  });

  socket.on("connectToRoom", (plrRoomID, myName)=>{
    
    socket.join(plrRoomID);

    plrMap.set(socket.id, plrRoomID);

    let roomObject = getRoomObj(plrRoomID);

    roomObject.numOfPlayers = roomObject.numOfPlayers + 1;
    roomObject.numPlayersAtStart = roomObject.numPlayersAtStart + 1;

    let plrColour = getRandomColor();
    roomObject.playerList.push(socket.id);
    roomObject.ogList.push(socket.id);
    roomObject.colourList.push(plrColour);

    var tempName = "";
    if(myName == ""){
      tempName = testNames[Math.floor(Math.random()*testNames.length)];
    }else{tempName=myName;}

    roomObject.playerName.push(tempName);
    roomObject.ogNames.push(tempName);
    roomObject.clrMap.set(socket.id, plrColour);
    roomObject.isAi.push(false);
    roomObject.hasLost.push(false);

    io.to(plrRoomID).emit("init", roomObject.numOfPlayers, roomObject.playerList, roomObject.playerName, plrColour);

    io.to(plrRoomID).emit("sync players", roomObject.playerList, roomObject.playerName, roomObject.colourList);

    io.to(plrRoomID).emit("reclog", '0xffbf36', tempName + " connected!");

    //===================================================================
  });


  socket.on("connectToRoom2", (plrRoomID, myName)=>{

    socket.join(plrRoomID);

    plrMap.set(socket.id, plrRoomID);

    let roomObject = getRoomObj(plrRoomID);
    var plrColour = getRandomColor();

    roomObject.numOfPlayers = roomObject.numOfPlayers + 1;
    roomObject.numPlayersAtStart = roomObject.numPlayersAtStart + 1;
    roomObject.playerList.push(socket.id);
    roomObject.ogList.push(socket.id);
    roomObject.colourList.push(plrColour);

    var tempName = "";
    if(myName == ""){
      tempName = testNames[Math.floor(Math.random()*testNames.length)];
    }else{tempName=myName;}
    roomObject.playerName.push(tempName);
    roomObject.ogNames.push(tempName);
    roomObject.clrMap.set(socket.id, plrColour);
    roomObject.isAi.push(false);
    roomObject.hasLost.push(false);


    //Add AI =================================================================
    var aiColour = getRandomColor();
    roomObject.numOfPlayers = roomObject.numOfPlayers + 1;
    roomObject.numPlayersAtStart = roomObject.numPlayersAtStart + 1;
    roomObject.playerList.push("AI");
    roomObject.ogList.push("AI");
    roomObject.colourList.push(aiColour);
    tempName = testNames[Math.floor(Math.random()*testNames.length)];
    roomObject.playerName.push(tempName);
    roomObject.ogNames.push(tempName);
    roomObject.clrMap.set("AI", aiColour);
    roomObject.isAi.push(true);
    roomObject.hasLost.push(false);

    io.to(plrRoomID).emit("reclog", '0xffbf36', tempName + " connected!");

    // ===============================================================================

    io.to(plrRoomID).emit("init", roomObject.numOfPlayers, roomObject.playerList, roomObject.playerName, plrColour);
    io.to(plrRoomID).emit("sync players", roomObject.playerList, roomObject.playerName, roomObject.colourList);

    // ================================================================================
  });

  socket.on("connectToRoom3", (plrRoomID, myName)=>{

    socket.join(plrRoomID);
    plrMap.set(socket.id, plrRoomID);

    let roomObject = getRoomObj(plrRoomID);
    var plrColour = getRandomColor();

    roomObject.numOfPlayers = roomObject.numOfPlayers + 1;
    roomObject.numPlayersAtStart = roomObject.numPlayersAtStart + 1;
    roomObject.playerList.push(socket.id);
    roomObject.ogList.push(socket.id);
    roomObject.colourList.push(plrColour);

    var tempName = "";
    if(myName == ""){
      tempName = testNames[Math.floor(Math.random()*testNames.length)];
    }else{tempName=myName;}
    roomObject.playerName.push(tempName);
    roomObject.ogNames.push(tempName);
    roomObject.clrMap.set(socket.id, plrColour);
    roomObject.isAi.push(false);
    roomObject.hasLost.push(false);


    //Add AI =================================================================

    var aiColour = getRandomColor();
    roomObject.numOfPlayers = roomObject.numOfPlayers + 1;
    roomObject.numPlayersAtStart = roomObject.numPlayersAtStart + 1;
    roomObject.playerList.push("AI");
    roomObject.ogList.push("AI");
    roomObject.colourList.push(aiColour);
    tempName = testNames[Math.floor(Math.random()*testNames.length)];
    roomObject.playerName.push(tempName);
    roomObject.ogNames.push(tempName);
    roomObject.clrMap.set("AI", aiColour);
    roomObject.isAi.push(true);
    roomObject.hasLost.push(false);
    
    io.to(plrRoomID).emit("reclog", '0xffbf36', tempName + " connected!");

    // ================================================================================================

    //Add AI =================================================================

    var aiColour = getRandomColor();
    roomObject.numOfPlayers = roomObject.numOfPlayers + 1;
    roomObject.numPlayersAtStart = roomObject.numPlayersAtStart + 1;
    roomObject.playerList.push("AI2");
    roomObject.ogList.push("AI2");
    roomObject.colourList.push(aiColour);
    tempName = testNames[Math.floor(Math.random()*testNames.length)];
    roomObject.playerName.push(tempName);
    roomObject.ogNames.push(tempName);
    roomObject.clrMap.set("AI2", aiColour);
    roomObject.isAi.push(true);
    roomObject.hasLost.push(false);

    io.to(plrRoomID).emit("reclog", '0xffbf36', tempName + " connected!");

    // ================================================================================================

    io.to(plrRoomID).emit("init", roomObject.numOfPlayers, roomObject.playerList, roomObject.playerName, plrColour);
    io.to(plrRoomID).emit("sync players", roomObject.playerList, roomObject.playerName, roomObject.colourList);    

    //===================================================================
  });

  socket.on("connectToRoom4", (plrRoomID, myName)=>{

    socket.join(plrRoomID);
    plrMap.set(socket.id, plrRoomID);

    let roomObject = getRoomObj(plrRoomID);
    roomObject.numOfPlayers = roomObject.numOfPlayers + 1;
    roomObject.numPlayersAtStart = roomObject.numPlayersAtStart + 1;

    var plrColour = getRandomColor();
    roomObject.playerList.push(socket.id);
    roomObject.ogList.push(socket.id);
    roomObject.colourList.push(plrColour);

    var tempName = "";
    if(myName == ""){
      tempName = testNames[Math.floor(Math.random()*testNames.length)];
    }else{tempName=myName;}
    roomObject.playerName.push(tempName);
    roomObject.ogNames.push(tempName);
    roomObject.clrMap.set(socket.id, plrColour);
    roomObject.isAi.push(false);
    roomObject.hasLost.push(false);


    //Add AI =================================================================

    var aiColour = getRandomColor();

    roomObject.numOfPlayers = roomObject.numOfPlayers + 1;
    roomObject.numPlayersAtStart = roomObject.numPlayersAtStart + 1;
    roomObject.playerList.push("AI");
    roomObject.ogList.push("AI");
    roomObject.colourList.push(aiColour);
    tempName = testNames[Math.floor(Math.random()*testNames.length)];
    roomObject.playerName.push(tempName);
    roomObject.ogNames.push(tempName);
    roomObject.clrMap.set("AI", aiColour);
    roomObject.isAi.push(true);
    roomObject.hasLost.push(false);
    
    io.to(plrRoomID).emit("reclog", '0xffbf36', tempName + " connected!");

    // ================================================================================================

    //Add AI =================================================================

    var aiColour = getRandomColor();

    roomObject.numOfPlayers = roomObject.numOfPlayers + 1;
    roomObject.numPlayersAtStart = roomObject.numPlayersAtStart + 1;
    roomObject.playerList.push("AI2");
    roomObject.ogList.push("AI2");
    roomObject.colourList.push(aiColour);
    tempName = testNames[Math.floor(Math.random()*testNames.length)];
    roomObject.playerName.push(tempName);
    roomObject.ogNames.push(tempName);
    roomObject.clrMap.set("AI2", aiColour);
    roomObject.isAi.push(true);
    roomObject.hasLost.push(false);

    io.to(plrRoomID).emit("reclog", '0xffbf36', tempName + " connected!");

    // ================================================================================================

    //Add AI =================================================================

    var aiColour = getRandomColor();
    
    roomObject.numOfPlayers = roomObject.numOfPlayers + 1;
    roomObject.numPlayersAtStart = roomObject.numPlayersAtStart + 1;
    roomObject.playerList.push("AI3");
    roomObject.ogList.push("AI3");
    roomObject.colourList.push(aiColour);
    tempName = testNames[Math.floor(Math.random()*testNames.length)];
    roomObject.playerName.push(tempName);
    roomObject.ogNames.push(tempName);
    roomObject.clrMap.set("AI3", aiColour);
    roomObject.isAi.push(true);
    roomObject.hasLost.push(false);
    
    io.to(plrRoomID).emit("reclog", '0xffbf36', tempName + " connected!");

    // ================================================================================================

    io.to(plrRoomID).emit("init", roomObject.numOfPlayers, roomObject.playerList, roomObject.playerName, plrColour);
    io.to(plrRoomID).emit("sync players", roomObject.playerList, roomObject.playerName, roomObject.colourList);

    //===================================================================
  });

  /*
    Note: There is a potential vulnerability here. Someone can modify
    index.html to send one of these request if they find out a room is full/is started
    (by attempting to join all the rooms) Not a big deal, but you should also
    verify that the request comes from a player who is in the room already.

  */
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
    roomObject.gameStarted = true;

    roomObject.setBoardColor();

    if(false){//DISBLED TEMP FOR TESTING roomObject.numOfPlayers == 1){
      socket.emit("badRequest", "Need more than 1 player!");
    }else{
      
      //Reset board when starting a new game.
      io.to(plrRoomID).emit("board init", roomObject.board);
      let n = roomObject.hasLost.length;
      for(let i = 0; i < n; i++)
        roomObject.hasLost[i] = false;

      io.to(plrRoomID).emit('start game', roomObject.playerName);
      roomObject.canJoin = false;
      
      for(let i = 0; i < roomObject.playerList.length; i++){
        let clrToDraw = roomObject.getPlayerColour(roomObject.playerList[i]);
        let [x,y] = getStartCoord(i);
        roomObject.board[x][y]=clrToDraw;
        io.to(plrRoomID).emit('board update', clrToDraw, x,y);
        io.to(plrRoomID).emit('assign num', i, roomObject.playerList[i], clrToDraw);

        //If this player is an AI, generate it's placed queue
        if(roomObject.isAi[i]){
          roomObject.placed[i] = new PriorityQueue();
          roomObject.placed[i].enqueue([x,y], (heuristic(x)*heuristic(y))*priOffset() );
        }
      }

      io.to(plrRoomID).emit('new turn', 0,roomObject.playerName[0],getRandNum());
      roomObject.currentTurn = 0;
    }
  });

  socket.on('turn update', (plrNum, plrRoomID, lost)=>{

    let roomObject = getRoomObj(plrRoomID);

    if(roomObject == null){
      return;
    }

    let numPlrs = roomObject.numPlayersAtStart;

    //Needs to skip the turns of players who have either:
    //(a) disconnected (maybe we can just not kick the player from the game so their timer runs out?)
    //(b) lost the game

    if(lost){
      roomObject.hasLost[plrNum] = true;
      io.to(plrRoomID).emit("reclog", '0xABCDEF', roomObject.ogNames[plrNum] + " is out!");
    }

    let nextTurn = -1;
    var i = 0;
    
    for(let i = 0; i < numPlrs; i++){
      let nextPotentialTurn =(plrNum+1+i)%numPlrs; 
      if (roomObject.hasLost[nextPotentialTurn] == false){
        nextTurn = nextPotentialTurn;
        break;
      }
    }
    roomObject.currentTurn = nextTurn;
    
    if(roomObject.checkWinCondition()){
      io.to(plrRoomID).emit("reclog", '0x00EE00', roomObject.ogNames[nextTurn] + " is the winner!");
      io.to(plrRoomID).emit('game over', roomObject.getWinner()[0], roomObject.getWinner()[1]);
    }else{
      var numICanPlace = getRandNum();
      io.to(plrRoomID).emit('new turn', nextTurn,roomObject.playerName[nextTurn], numICanPlace);

      //If the next player is an AI, there will be no player to receive 'new turn' with their respective playerNum
      //so we need to manually tell the AI to begin its turn.
      if(roomObject.isAi[nextTurn]){
        aiMove(roomObject, plrRoomID, nextTurn, numPlrs, numICanPlace)
      }
    }
  })
  
  socket.on('go to wait', (plrRoomID) =>{
    let roomObject = getRoomObj(plrRoomID);
    roomObject.canJoin = true;
    io.to(plrRoomID).emit('go to wait');
  });


  // PLAYER DISCONNECT =================================================
	socket.on('disconnect', () => {
      let plrRoomID = plrMap.get(socket.id);
      if(plrRoomID != null){
        let roomObject = getRoomObj(plrRoomID);
        let index = roomObject.playerList.indexOf(socket.id);

        if(!roomObject.gameStarted){
          roomObject.ogList.splice(index, 1);
          roomObject.ogNames.splice(index, 1);
        }

        let ogIndex = roomObject.ogList.indexOf(socket.id);
        
        roomObject.hasLost[ogIndex] = true;

        socket.emit("disc");
        roomObject.numOfPlayers--;

        io.to(plrRoomID).emit("reclog", '0xfc5b35', roomObject.playerName[index] + " disconnected.");
        
        roomObject.playerList.splice(index, 1);
        roomObject.playerName.splice(index, 1);
        roomObject.colourList.splice(index, 1);
        
        io.to(plrRoomID).emit("remove player", roomObject.playerList, roomObject.playerName, roomObject.colourList);

        //Start the next turn when the active turn disconnects.
        if(roomObject.currentTurn == ogIndex){
          let numPlrs = roomObject.numPlayersAtStart;
          let nextTurn = -1;
          var i = 0;
          for(let i = 0; i < numPlrs; i++){
            let nextPotentialTurn =(ogIndex+i)%numPlrs; 
            if (roomObject.hasLost[nextPotentialTurn] == false){
              nextTurn = nextPotentialTurn;
              break;
            }
          }
          roomObject.currentTurn = nextTurn;
          io.to(plrRoomID).emit('new turn', nextTurn,roomObject.playerName[nextTurn], getRandNum());
        }

        //Note: need to delete room in case player was last in the room.
      }
  	});
  // =======================================================================



});



server.listen(3000, () =>{
	console.log('listening on *:3000');
});