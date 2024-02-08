



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

});

window.addEventListener('beforeunload', function (event) {
    socket.disconnect();
});

window.addEventListener('unload', function (event) {
    socket.disconnect();
});
