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
	      //console.log(timerSeconds);
	      if(gameScene.clock != null){
	      	gameScene.clock.setText(timerSeconds);
	      	//At least make sure console is on the same page
	      	console.log(timerSeconds);
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
	//We need to tell server....
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
	console.log('Poop')
	document.getElementById("ga").style.display = "block";
}

function goBackToWait(){
	//I need to emit something so all players transition back to the menu
	socket.emit('go to wait', roomID);
}

function chatOn(){

	//toggle id "cht" and "cw"
	var cw = document.getElementById("cw");
	var cht = document.getElementById("cht");
	var splsh = document.getElementById("splsh");

	splsh.style.display = "none";

	/* THIS WILL ENABLE CHAT!!!
	if(cw.style.display === "none"){
		cw.style.display = "block";
	}else{
		cw.style.display = "none";
	}

	if(cht.style.display === "none"){
		cht.style.display = "block";
	}else{
		cht.style.display = "none";
	}
	*/
	/* CAN WE ALSO TRANSITION THE SCENE HERE??? */
	menuScene.loadWaiting();
	//menuScene.goToGame();
}

function waitRoomUpdateNames(){
	document.getElementById("namesToDisplay").innerHTML = "";
	//playerNames
	for(let i = 0; i < playerNames.length; i++){
		document.getElementById("namesToDisplay").innerHTML+= playerNames[i] + "<br>"
	}

	//ALSO UPDATE THE PLAYER COUNT THING
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
	//We should actualy wait tfor confirmeation before we join tnhe room from the server
	//so waitr room DISAply shoudl not be caleld until the client cogets conffirmeation from th
	//server.
	//waitRoomDisplay()
	roomID = document.getElementById("customRoomID").value;
	//Here now I need to emit some sort of "createPrivateServer" event...
	socket.emit("requestToJoinRoom", roomID);
	//Now we handle the rest of this once we receive confirmation...
}

function gotServerConfirmation(){
	//this is waher we should call waitRoom(Displpp)
	waitRoomDisplay();
}
function createWaitRoom(){

	//waitRoomDisplay()

	//Here now I need to emit some sort of "createPrivateServer" event...
	socket.emit("requestRoomID");
	//Now we handle the rest of this once we receive confirmation...
}

function twoPlayers(){

	//For now, basically create a test room
	socket.emit("requestRoomID2");

}

function threePlayers(){

	//For now, basically create a test room
	socket.emit("requestRoomID3");

}

function fourPlayers(){

	//For now, basically create a test room
	socket.emit("requestRoomID4");

}

function goToGame(){
	
	

	console.log("I should be called... now I go to server...")
	//WE ACTUALLY CAN'T CALL THIS HERE, WE NEED TO CALL IT FOR EVERYONE IN THE ROOM!
	socket.emit("start game", roomID);
	//menuScene.goToGame();
	//cw.style.display = "block";
	//cht.style.display = "block";
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
	
	//await gameScene != null;
	cw.style.display = "block";
	cht.style.display = "block";
}












