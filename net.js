
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
        console.log("HEREREREHERHEHREHEHE:" + gameScene.numText);
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

socket.on('sync players', (plrList, plrName, clrList)=> {
        playerList = [];
        for(plr in plrList){
            playerList.push(plrList[plr]);
        }

        playerNames = [];
        for(plr in plrName){
            playerNames.push(plrName[plr]);
        }

        ogColours = [];
        for(plr in plrName){
            ogColours.push(clrList[plr]);
        }
        if(pbs.scene != null){
            pbs.addAllPlayerBoxes();
        }

        waitRoomUpdateNames();
        
});

socket.on('recmsg', (clr, name, msg) => {
    console.log('do i fire?')
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

socket.on('remove player', (plrList, plrName, clrList)=> {
    playerList = [];
    for(plr in plrList){
        playerList.push(plrList[plr]);
    }

    playerNames = [];
    for(plr in plrName){
        playerNames.push(plrName[plr]);
    }

    ogColours = [];
    for(plr in plrName){
        ogColours.push(clrList[plr]);
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
    let myName = document.getElementById("pn").value;
    //We want to say like: "hey we are in the room!"
    socket.emit('connectToRoom', rmid, myName);
});

socket.on('sendRoomIDAI', (rmid) => {
    gotServerConfirmation();
    roomID = rmid;
    document.getElementById("rmid").innerHTML = "Room ID: <u>" + rmid+"</u>";
    let myName = document.getElementById("pn").value;
    //We want to say like: "hey we are in the room!"
    socket.emit('connectToRoomAI', rmid, myName);
});

socket.on('badRequest', (msg) => {
    alert(msg);
    //This is where I should display some sort of message
});

socket.on('start game', (ogNme)=>{
    ogNames = ogNme;
    startGameForAll();
});


socket.on('assign num', (plrNum, plrSock, plrColor)=>{
    playerColours[plrNum] = plrColor;
    if (plrSock == socket.id){
        playerNum = plrNum;
    }
});


var gameOver = false;
socket.on('tick', ()=>{
    if(!gameOver){
        if (timerSeconds > -1) {
          if(gameScene.clock != null){
            gameScene.clock.setText(timerSeconds);
          }
          timerSeconds--;
        } else if (myTurn){
                lose();    
        }
    }
});

socket.on('game over', ()=>{
    gameScene.displayWinScreen("Poop")
    gameOver = true;
    gameover();
})

socket.on('go to wait', ()=>{
    //We need to go back to the wait screen...
    gameScene.goToWait()
});

//This is where we handle someone getting a turn.
socket.on('new turn', (plrNum, plrNam, numToPlace)=>{
    //YOU NEED TO DISPLAY SOM E STUFF HERE!!!!!!!!!!!
    let test =new Date().toLocaleString();
    console.log(test)
    //startCD();
    timerSeconds = 20;
    numAllowedToPlace = numToPlace;
    //gameScene
    numLeft = numToPlace;
    //We need to somehow wait here for gameScene to be init...
    if(gameScene == null){
        startGameForAll();
    }
    whoseTurn = plrNum;
    gameScene.newTurnGraphic(ogNames[whoseTurn]);
    
    //Update some graphics stuff
    if(gameScene.numText != null){
        gameScene.numText.setText(numToPlace+"/"+numToPlace);
        console.log(playerColours[whoseTurn]);
        gameScene.numText.setColor(convertColorCode(playerColours[whoseTurn]))

        gameScene.nameTextRight.setText(ogNames[whoseTurn])
        gameScene.nameTextRight.setColor(convertColorCode(playerColours[whoseTurn]))

        gameScene.clock.setText(timerSeconds);
        gameScene.clock.setColor(convertColorCode(playerColours[whoseTurn]))
    }

    if (playerNum == plrNum){
        myTurn = true;
        
    }



});



// =======================================================================

window.addEventListener('beforeunload', function (event) {
    socket.disconnect();
});

window.addEventListener('unload', function (event) {
    socket.disconnect();
});
