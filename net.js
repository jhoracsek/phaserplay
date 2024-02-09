
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
});




// =======================================================================

window.addEventListener('beforeunload', function (event) {
    socket.disconnect();
});

window.addEventListener('unload', function (event) {
    socket.disconnect();
});
