/*
	Convers colors of the form:
		0xFFFFFF
	To:
		#FFFFFF
*/
function convertColorCode(color){
	if(color == null)
		return null;
	return '#' + color.slice(2,8);
}

function dummy(){
	console.log("Hiya!");
}

//From some guy on github I don't remember.
function getRandomColor() {
	var letters = '0123456789ABCDEF';
	var color = '0x';
	for (var i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * 16)];
	}
	return color;
}

let MAXTIME = 15;
var timerSeconds = MAXTIME;
let interval;
function startCD(){
	//Add like one extra second of buffer...
	timerSeconds = MAXTIME;
	clearInterval(interval);
	interval = setInterval(() => {
	    if (timerSeconds > -1) {
	    	//Dont update graphic when timer = 0/1;
	      if(gameScene.clock != null){
	      	gameScene.clock.setText(timerSeconds);
	      	//At least make sure console is on the same page
	      }
	      timerSeconds--;
	    } else {
	    	if(myTurn){
	      		lose();
	    	}
	      clearInterval(interval);
	    }
	  }, 1000);
}

function lose(){
	//Disconnected players can't call this...
	socket.emit('turn update', playerNum, roomID, true);
}


function setName(){
    socket.emit('name change', document.getElementById("pn").value, roomID);
}

function sendMessage(){
    socket.emit('sendmsg', document.getElementById("msg").value, playerColor, roomID);
    document.getElementById("msg").value="";
}

function resetBoard(){
    socket.emit('reset', roomID);
}

//Make sure chat is hidden by default
document.getElementById("cw").style.display = "none";
document.getElementById("cht").style.display = "none";
document.getElementById("waitingWindow").style.display = "none";
document.getElementById("waitingWinNames").style.display = "none";
document.getElementById("plrCount").style.display = "none";
document.getElementById("plrCount").style.display = "none";
document.getElementById("ga").style.display = "none";

function gameover(){
	document.getElementById("ga").style.display = "block";
}

function goBackToWait(){
	socket.emit('go to wait', roomID);
}

function chatOn(){

	var cw = document.getElementById("cw");
	var cht = document.getElementById("cht");
	var splsh = document.getElementById("splsh");

	splsh.style.display = "none";

	menuScene.loadWaiting();
}

function waitRoomUpdateNames(){
	document.getElementById("namesToDisplay").innerHTML = "";
	for(let i = 0; i < playerNames.length; i++){
		document.getElementById("namesToDisplay").innerHTML+= playerNames[i] + "<br>"
	}
	document.getElementById("plrCount").innerHTML = "("+playerNames.length+"/4)";
}

function waitRoomDisplay(){

	var cw = document.getElementById("cw");
	var cht = document.getElementById("cht");
	var splsh = document.getElementById("splsh");
	var ww = document.getElementById("waitingWindow");
	var wwn = document.getElementById("waitingWinNames");
	var plrCount = document.getElementById("plrCount");
	var playAgain = document.getElementById("ga");

	cw.style.display = "none";
	cht.style.display = "none";


	splsh.style.display = "none";
	playAgain.style.display = "none";

	ww.style.display = "block";
	wwn.style.display = "block";
	plrCount.style.display = "block";
	playAgain = "false";

	menuScene.loadWaiting();
}

function joinWaitRoom(){
	roomID = document.getElementById("customRoomID").value;
	socket.emit("requestToJoinRoom", roomID);
}

function gotServerConfirmation(){
	waitRoomDisplay();
}
function createWaitRoom(){
	socket.emit("requestRoomID");
}

function twoPlayers(){
	socket.emit("requestRoomID2");

}

function threePlayers(){
	socket.emit("requestRoomID3");
}

function fourPlayers(){
	socket.emit("requestRoomID4");

}

function goToGame(){
	
	socket.emit("start game", roomID);
}

async function startGameForAll(){
	gameOver = false;
	menuScene.goToGame();
	gameScene.removeWinScreen();
	var cw = document.getElementById("cw");
	var cht = document.getElementById("cht");
	var splsh = document.getElementById("splsh");
	var ww = document.getElementById("waitingWindow");
	var wwn = document.getElementById("waitingWinNames");
	var plrCount = document.getElementById("plrCount");

	ww.style.display = "none";
	wwn.style.display = "none";
	plrCount.style.display = "none";
	
	cw.style.display = "block";
	cht.style.display = "block";
}












