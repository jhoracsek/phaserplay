
socket.emit('init');

socket.on('init', (num, plrLst, plrNme, clr)=> {
    if(initialized == false){
        playerColor = clr;
        initialized = true;
    }
});

socket.on("board init", (brd) => {
    board = brd;
    for(let i = 0; i < 16; i++){
        for(let j = 0; j < 16; j++){
            board[i][j] = brd[i][j];
        }
    }
    for(let i = 0; i < 16; i++){
        for(let j = 0; j < 16; j++){

            pixStore[i][j].updateColor(board[i][j]);
        }
    }
});


socket.on('board update', (cell, i,j)=>{
    
    board[i][j] = cell;
    pixStore[i][j].updateColor(board[i][j]);
    numLeft--;
    if(gameScene.numText!=null){
        gameScene.numText.setText(numLeft+"/"+numAllowedToPlace);
    }
});

socket.on('board reset', (brd)=>{
    for(let i = 0; i < 16; i++){
        for(let j = 0; j < 16; j++){
            board[i][j] = brd[i][j];
            pixStore[i][j].updateColor(board[i][j]);
          }
      }
});

socket.on('sync players', (plrList, plrName)=> {
        playerList = [];
        for(plr in plrList){
            playerList.push(plrList[plr]);
        }

        playerNames = [];
        for(plr in plrName){
            playerNames.push(plrName[plr]);
        }
        if(pbs.scene != null){
            pbs.addAllPlayerBoxes();
        }
        console.log(playerNames);
        waitRoomUpdateNames();
        
});

socket.on('recmsg', (clr, name, msg) => {
        const element = document.getElementById("cww");
        let old = element.innerHTML;
        if (old == ""){

            element.innerHTML = "<span class=\"small\"></span>" + "<b style=\"color:"+convertColorCode(clr)+";\">" + name + ":</b> " + msg;    
        }else{
            element.innerHTML = old + "<br>" + "<b style=\"color:"+convertColorCode(clr)+";\">" + name + ":</b> " + msg;
        }
        msgWin.scrollTop = msgWin.scrollHeight;

    });

socket.on('reclog', (clr, msg) => {
    const element = document.getElementById("cww");
    let old = element.innerHTML;
    if (old == ""){

        element.innerHTML = "<span class=\"small\"></span>" + "<b style=\"color:"+convertColorCode(clr)+";\">" + msg + "</b> ";    
    }else{
        element.innerHTML = old + "<br>" + "<b style=\"color:"+convertColorCode(clr)+";\">" + msg + "</b> ";
    }
    msgWin.scrollTop = msgWin.scrollHeight;

});

socket.on('disc', ()=>{
    socket.disconnect();
});

socket.on('remove player', (plrList, plrName)=> {
    playerList = [];
    for(plr in plrList){
        playerList.push(plrList[plr]);
    }

    playerNames = [];
    for(plr in plrName){
        playerNames.push(plrName[plr]);
    }
    
    if(pbs.scene != null){
        pbs.addAllPlayerBoxes();
    }
    waitRoomUpdateNames();
});
// ADDITIONAL STUFF FOR ROOMS ============================================

socket.on('sendRoomID', (rmid) => {
    gotServerConfirmation();
    roomID = rmid;
    document.getElementById("rmid").innerHTML = "Room ID: <u>" + rmid+"</u>";
    console.log(rmid);
    let myName = document.getElementById("pn").value;
    //We want to say like: "hey we are in the room!"
    socket.emit('connectToRoom', rmid, myName);
});

socket.on('badRequest', (msg) => {
    alert(msg);
    //This is where I should display some sort of message
});

socket.on('start game', ()=>{
    startGameForAll();
    console.log('I should be init here and print before poop...')
});


socket.on('assign num', (plrNum, plrSock, plrColor)=>{
    console.log('here:' + plrColor)
    playerColours[plrNum] = plrColor;
    if (plrSock == socket.id){
        playerNum = plrNum;
        console.log(playerNum);
    }
});

//This is where we handle someone getting a turn.
socket.on('new turn', (plrNum, plrNam, numToPlace)=>{
    //YOU NEED TO DISPLAY SOM E STUFF HERE!!!!!!!!!!!
    numAllowedToPlace = numToPlace;
    //gameScene
    numLeft = numToPlace;
    //We need to somehow wait here for gameScene to be init...
    if(gameScene == null){
        startGameForAll();
    }console.log(gameScene);
    
    gameScene.newTurnGraphic(plrNam);
    whoseTurn = plrNum;
    //Update some graphics stuff
    if(gameScene.numText != null){
        gameScene.numText.setText(numToPlace+"/"+numToPlace);
        gameScene.numText.setColor(convertColorCode(playerColours[whoseTurn]))

        console.log(playerNames[plrNum])
        gameScene.nameTextRight.setText(playerNames[whoseTurn])
        gameScene.nameTextRight.setColor(convertColorCode(playerColours[whoseTurn]))
    }

    if (playerNum == plrNum){
        //It's my turn!!!
        //I think we should set some flag, like myTurn = true;
        //Then count the number of clicks. If The number of clicks exceeds like 5
        //Then make another turn...
        myTurn = true;
        
    }

    startCD();

});



// =======================================================================

window.addEventListener('beforeunload', function (event) {
    socket.disconnect();
});

window.addEventListener('unload', function (event) {
    socket.disconnect();
});
