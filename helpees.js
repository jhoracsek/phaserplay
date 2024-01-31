


/*
	Convers colors of the form:
		0xFFFFFF
	To:
		#FFFFFF
*/
function convertColorCode(color){
	return '#' + color.slice(2,8);
}