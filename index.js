const express = require('express');
const app = express();
app.use(express.static("./"));
const http = require('http');
const https = require('https');
const server = http.createServer(app);
//const serverHttps = https.createServer(app);

const { Server } = require("socket.io");
const io = new Server(server);



//THESE SHOULD ALL BE ABLE TO BE REMOVED....
//var playerList = [];
//var playerName = [];

var numOfPlayers = 0;
const plrMap = new Map();
var testNames = ["Dave", "Steve", "Ted", "Jay", "Danny", "xCoolGuy", "Poopy Boy", "Stoopy Poopy", "SloopyPooButt", "Ronnie", "Donnie", "Scone", "Drone", "Troned", "Spooniemo"];



// ROOM SETUP STUFF =================================================
//This seems sufficient, I doubt there would ever be larger than 10067 concurrent servers...
//These are also specifically PRIVATE ROOMS... There should be another array for public rooms.
//Actually makes more sense for this to be ALL rooms. There is just a flag if it's private or not
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
  return 0.9 + Math.random() * 0.1;
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
      return 0.9;
    case 7:
      return 1;
    case 8:
      return 1;
    case 9:
      return 0.9;
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
  I don't even need to clr really, I should just look at all the tiles and place one randomly...
*/
function validTile(gameBoard, placed){
  let n = placed.length();
  //The "placed" list should be sorted so max priority tiles are first!!!
  for(let i = 0; i < n; i++){

    let x = placed.get(i)[0];
    let y = placed.get(i)[1];
    
    //Just add them to the candidates then choose a random candidate...
    //Yeah this is a dirty implementation... should be fixed
    var candidates=[];
    var pri=[];
    if(x > 0 && (gameBoard[x-1][y] == '0xEFEFEF' || gameBoard[x-1][y] == '0xFFFFFF')){
        candidates.push([x-1,y]);
        pri.push(heuristic(x-1)+heuristic(y));
    }
    
    if(x < 15 && (gameBoard[x+1][y] == '0xEFEFEF' || gameBoard[x+1][y] == '0xFFFFFF')){
        candidates.push([x+1,y]);
        pri.push(heuristic(x+1)+heuristic(y));
    }
    if(y > 0 && (gameBoard[x][y-1] == '0xEFEFEF' || gameBoard[x][y-1] == '0xFFFFFF')){
        candidates.push([x,y-1]);
        pri.push(heuristic(x)+heuristic(y-1));
    }
    if(y < 15 && (gameBoard[x][y+1] == '0xEFEFEF' || gameBoard[x][y+1] == '0xFFFFFF')){
        candidates.push([x,y+1]);
        pri.push(heuristic(x)+heuristic(y+1));
    }
    if(candidates.length > 0){
      //choose a random candidate
      //This should use some heuristic... (basically whichever tile brings them closest to center...)
      const maxIndex = getMaxIndex(pri);
      //const randomIndex = Math.floor(Math.random()*candidates.length);
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


//AI FOR LOOP!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

//Poop!
//What arguments do I need????
//I need somme bullshit
function aiMove(roomObject, plrRoomID, nextTurn, numPlrs, numICanPlace){
  var cell = roomObject.colourList[nextTurn];

  var z = 0;
  
  function timedLoop(){
    //This is a single iteration
    if(z < numICanPlace){
      var tile = validTile(roomObject.board, roomObject.placed[nextTurn]);
      console.log(tile);
      if(tile != null){ 
        roomObject.placed[nextTurn].enqueue(tile, (heuristic(tile[0])+heuristic(tile[1]))*priOffset());
        roomObject.board[tile[0]][tile[1]] = cell;

        io.to(plrRoomID).emit('board update', cell, tile[0],tile[1]);
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

    }
  }
  const interval = setInterval(timedLoop, 500);
  
}

///



app.get('/', (req, res)=>{
	res.sendFile(__dirname + '/index.html');
});


setInterval(()=>{
    io.emit("tick");
  }, 1000)

io.on('connection', (socket) => {
  //All the stuff below should just happen when a player enters a room.
  // ON PLAYER CONNECT =================================================
	console.log('a user', socket.id,  'connnected');
  numOfPlayers++;

  

  socket.on("requestToJoinRoom", (rmid)=>{
    //this is a socket.emit because you're just sending this back to the guy...
    let roomobject = getRoomObj(rmid);
    //Create unique room id.
    //console.log(roomobject.numOfPlayers)
    if(roomobject == null){
      socket.emit("badRequest", "Room does not exist!");
    //These shoudl be functions that update dynamically!
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
    //this is a socket.emit because you're just sending this back to the guy...
    
    //Create unique room id.
    let roomID = generateNewRoom();
    socket.emit("sendRoomID", (roomID));

  });

  socket.on("requestRoomIDAI", ()=>{
    //this is a socket.emit because you're just sending this back to the guy...
    
    //Create unique room id.
    let roomID = generateNewRoom();
    socket.emit("sendRoomIDAI", (roomID));

  });

  socket.on("connectToRoom", (plrRoomID, myName)=>{
    //So here we have both the players roomID and their socket
    //Need to get room object...
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

    //io.to(plrRoomID).emit("board init", roomObject.board);

    

    roomObject.clrMap.set(socket.id, plrColour);
    roomObject.isAi.push(false);
    roomObject.hasLost.push(false);

    io.to(plrRoomID).emit("init", roomObject.numOfPlayers, roomObject.playerList, roomObject.playerName, plrColour);

    io.to(plrRoomID).emit("sync players", roomObject.playerList, roomObject.playerName, roomObject.colourList);


    //Needs tp ja pahppen befre this one
    io.to(plrRoomID).emit("reclog", '0xffbf36', tempName + " connected!");

    //===================================================================
  });


  socket.on("connectToRoomAI", (plrRoomID, myName)=>{
    //So here we have both the players roomID and their socket
    //Need to get room object...
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

    //io.to(plrRoomID).emit("board init", roomObject.board);

    

    roomObject.clrMap.set(socket.id, plrColour);
    roomObject.isAi.push(false);
    roomObject.hasLost.push(false);


    //NOW ADD AN AI CHARACTER JUST 1 =================================================================


    roomObject.numOfPlayers = roomObject.numOfPlayers + 1;
    roomObject.numPlayersAtStart = roomObject.numPlayersAtStart + 1;

    var aiColour = getRandomColor();
    roomObject.playerList.push("AI");
    roomObject.ogList.push("AI");
    roomObject.colourList.push(aiColour);

    var tempName = "";
    tempName = testNames[Math.floor(Math.random()*testNames.length)];
    roomObject.playerName.push(tempName);
    roomObject.ogNames.push(tempName);

    //io.to(plrRoomID).emit("board init", roomObject.board);

    

    roomObject.clrMap.set("AI", aiColour);
    roomObject.isAi.push(true);

    roomObject.hasLost.push(false);

    // ================================================================================================

    io.to(plrRoomID).emit("init", roomObject.numOfPlayers, roomObject.playerList, roomObject.playerName, plrColour);

    io.to(plrRoomID).emit("sync players", roomObject.playerList, roomObject.playerName, roomObject.colourList);


    //Needs tp ja pahppen befre this one
    io.to(plrRoomID).emit("reclog", '0xffbf36', tempName + " connected!");

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
    /*
      Let's start by just drawing each thing...
    */
    let roomObject = getRoomObj(plrRoomID);
    roomObject.gameStarted = true;

    roomObject.setBoardColor();

    if(false){//DISBLED TEMP FOR TESTroomObject.numOfPlayers == 1){
      socket.emit("badRequest", "Need more than 1 player!");
    }else{
      
      //RESET BOARD IN CASE OF STARTING A NEW GAME
      io.to(plrRoomID).emit("board init", roomObject.board);
      let n = roomObject.hasLost.length;
      for(let i = 0; i < n; i++)
        roomObject.hasLost[i] = false;

      io.to(plrRoomID).emit('start game', roomObject.playerName);
      roomObject.canJoin = false;
      //Now the game has started!!!!

      //print colours
      //for(let i = 0; i < roomObject.playerList.length; i++){
      //  console.log(roomObject.playerName[i] + ": " + roomObject.getPlayerColour(roomObject.playerList[i]));
      //}

      //Update board with initial colours:
      for(let i = 0; i < roomObject.playerList.length; i++){
        let clrToDraw = roomObject.getPlayerColour(roomObject.playerList[i]);
        let [x,y] = getStartCoord(i);
        //console.log(x,y);
        roomObject.board[x][y]=clrToDraw;
        io.to(plrRoomID).emit('board update', clrToDraw, x,y);
        io.to(plrRoomID).emit('assign num', i, roomObject.playerList[i], clrToDraw);

        if(roomObject.isAi[i]){
          //If it's an AI generate it's "placed" thing
          roomObject.placed[i] = new PriorityQueue();
          roomObject.placed[i].enqueue([x,y], (heuristic(x)+heuristic(y))*priOffset() );
        }
      }
      //For now, the number a player is allowed to place is just 5. Going forward it will be random.

      //Maybe just define your own distribution function.
      io.to(plrRoomID).emit('new turn', 0,roomObject.playerName[0],getRandNum());
      roomObject.currentTurn = 0;
    }
  });

  socket.on('turn update', (plrNum, plrRoomID, lost)=>{
    //Should be the player after plrNum...

    let roomObject = getRoomObj(plrRoomID);

    if(roomObject == null){
      return;
    }


    //console.log("Whose turn ended??" + plrNum)

    let numPlrs = roomObject.numPlayersAtStart;

    //Needs to skip the turns of players who have either:
    //(a) disconnected (maybe we can just not kick the player from the game so their timer runs out?)
    //(b) lost the game

    if(lost){
      roomObject.hasLost[plrNum] = true;
      io.to(plrRoomID).emit("reclog", '0xABCDEF', roomObject.ogNames[plrNum] + " is out!");
      //Need to make sure the last player is declared the winner.......
    }

    let nextTurn = -1;
    var i = 0;
    //This should
    for(let i = 0; i < numPlrs; i++){
      let nextPotentialTurn =(plrNum+1+i)%numPlrs; 
      if (roomObject.hasLost[nextPotentialTurn] == false){
        nextTurn = nextPotentialTurn;
        break;
      }
    }
    roomObject.currentTurn = nextTurn;
    //let nextTurn = (plrNum+1)%numPlrs;
    //CHECK THE WIN CONDITION!!!!!!!!!! SHOULD BE A FUNCTION OF THE CLASS!!!!!!!!!!!!!!!!!!!!!

    //console.log(roomObject.checkWinCondition());
    //So something like
    
    if(roomObject.checkWinCondition()){
      io.to(plrRoomID).emit("reclog", '0x00EE00', roomObject.ogNames[nextTurn] + " is the winner!");

      //Maybe also pass the winning players name here??
      io.to(plrRoomID).emit('game over');
    }else{
      var numICanPlace = getRandNum();
      io.to(plrRoomID).emit('new turn', nextTurn,roomObject.playerName[nextTurn], numICanPlace);


      //Here we want to check if the player is a an AIIIIIIIIIIIIIIIIIIII
      if(roomObject.isAi[nextTurn]){
        aiMove(roomObject, plrRoomID, nextTurn, numPlrs, numICanPlace)
        //Poop!
        /*
        var cell = roomObject.colourList[nextTurn];
        for(let z = 0; z < numICanPlace; z++){
          //Need to basically emmit a faux turn at weird intervals...
          var tile = validTile(roomObject.board, roomObject.placed[nextTurn]);
          console.log(tile);
          if(tile == null)
            break;
          roomObject.placed[nextTurn].push(tile);
          roomObject.board[tile[0]][tile[1]] = cell;
          io.to(plrRoomID).emit('board update', cell, tile[0],tile[1]);
        }


        //NOW EMIT THE NEXT TURN!!!!
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
        */
        //Old poop!
      }
    }

    

    //io.to(plrRoomID).emit('new turn', nextTurn,roomObject.playerName[nextTurn], getRandNum());
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
        //Need to iterate through playerList to find the index associated w/ the player.
        //roomObject.playerList
        /*
        let plrs=roomObject.playerList;
        let n = plrs.length;
        let ind = 0;
        for(ind = 0; ind < n; ind++){
          if(plrs[ind] == socket.id){
            break;
          }
        }
        */

        
        roomObject.hasLost[ogIndex] = true;

        socket.emit("disc");
        roomObject.numOfPlayers--;




        io.to(plrRoomID).emit("reclog", '0xfc5b35', roomObject.playerName[index] + " disconnected.");

        
        roomObject.playerList.splice(index, 1);
        roomObject.playerName.splice(index, 1);
        roomObject.colourList.splice(index, 1);
        io.to(plrRoomID).emit("remove player", roomObject.playerList, roomObject.playerName, roomObject.colourList);

        //I don't think we even should do this, I think it's sufficient to just remove it from the client and preserve the list order here.
        //
        //

        //Start the next turn when the active turn disconnects.
        if(roomObject.currentTurn == ogIndex){
        
          let numPlrs = roomObject.numPlayersAtStart;
          let nextTurn = -1;
          var i = 0;
          //This should
          for(let i = 0; i < numPlrs; i++){
            let nextPotentialTurn =(ogIndex+i)%numPlrs; 
            if (roomObject.hasLost[nextPotentialTurn] == false){
              nextTurn = nextPotentialTurn;
              break;
            }
          }
          //You hit once...
          roomObject.currentTurn = nextTurn;
          io.to(plrRoomID).emit('new turn', nextTurn,roomObject.playerName[nextTurn], getRandNum());
        }
        //let nextTurn = (plrNum+1)%numPlrs;

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