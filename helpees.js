/*
	Convers colors of the form:
		0xFFFFFF
	To:
		#FFFFFF
*/
function convertColorCode(color){
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


function setName(){
    socket.emit('name change', document.getElementById("pn").value);
}

function sendMessage(){
    socket.emit('sendmsg', document.getElementById("msg").value, playerColor);
    document.getElementById("msg").value="";
}

function resetBoard(){
    socket.emit('reset');
}

//Make sure chat is hidden by default
document.getElementById("cw").style.display = "none";
document.getElementById("cht").style.display = "none";
document.getElementById("waitingWindow").style.display = "none";
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

function goToWait(){

	//toggle id "cht" and "cw"
	var cw = document.getElementById("cw");
	var cht = document.getElementById("cht");
	var splsh = document.getElementById("splsh");
	var ww = document.getElementById("waitingWindow");

	splsh.style.display = "none";
	ww.style.display = "block";

	menuScene.loadWaiting();




}












