var vid, trlaud, trlmutebtn, trlvolumeslider, fullscreenbtn;
function intializePlayer(){
	// Set object references
	vid = document.getElementById("remoteVideo");
	trlaud = document.getElementById("transAudio");
	trlmutebtn = document.getElementById("trlmutebtn");
	trlvolumeslider = document.getElementById("trlvolumeslider");
	fullscreenbtn = document.getElementById("fullscreenbtn");
	// Add event listeners
	trlmutebtn.addEventListener("click",trlmute,false);
	trlvolumeslider.addEventListener("change",trlsetvolume,false);
	trlaud.muted = true;
}
//window.onload = intializePlayer;
function srcmute(){
	if(srcaud.muted){
		srcaud.muted = false;
		srcmutebtn.innerHTML = "";
		$('#srcmutebtn').append('<span class="glyphicon glyphicon-volume-up"></span>');
		$('#srcmutebtn').removeClass('btn-warning');
		$('#srcmutebtn').addClass('btn-success');
	} else {
		srcaud.muted = true;
		srcmutebtn.innerHTML = "";
		$('#srcmutebtn').append('<span class="glyphicon glyphicon-volume-off"></span>');
		$('#srcmutebtn').addClass('btn-warning');
		$('#srcmutebtn').removeClass('btn-success');
	}
}
function trlmute(){
	if(trlaud.muted){
		trlaud.muted = false;
		trlmutebtn.innerHTML = "";
		$('#trlmutebtn').append('<span class="glyphicon glyphicon-volume-up"></span>');
		$('#trlmutebtn').removeClass('btn-warning');
		$('#trlmutebtn').addClass('btn-success');
		var list = document.getElementsByClassName("trldAudio");
		for (var i = 0; i < list.length; i++) {
			list[i].muted = false;
		}
	} else {
		trlaud.muted = true;
		trlmutebtn.innerHTML = "";
		$('#trlmutebtn').append('<span class="glyphicon glyphicon-volume-off"></span>');
		$('#trlmutebtn').addClass('btn-warning');
		$('#trlmutebtn').removeClass('btn-success');
		var list = document.getElementsByClassName("trldAudio");
		for (var i = 0; i < list.length; i++) {
			list[i].muted = true;
		}
	}
}
function mixmute(){
	if(mixaud.muted){
		mixaud.muted = false;
		mixmutebtn.innerHTML = "";
		$('#mixmutebtn').append('<span class="glyphicon glyphicon-volume-up"></span>');
		$('#mixmutebtn').removeClass('btn-warning');
		$('#mixmutebtn').addClass('btn-success');
	} else {
		mixaud.muted = true;
		mixmutebtn.innerHTML = "";
		$('#mixmutebtn').append('<span class="glyphicon glyphicon-volume-off"></span>');
		$('#mixmutebtn').addClass('btn-warning');
		$('#mixmutebtn').removeClass('btn-success');
	}
}
function srcsetvolume(){
	srcaud.volume = srcvolumeslider.value / 100;
}
function trlsetvolume(){
	trlaud.volume = trlvolumeslider.value / 100;
	var list = document.getElementsByClassName("trldAudio");
	for (var i = 0; i < list.length; i++) {
		list[i].volume = trlvolumeslider.value / 100;
	}
}
function mixsetvolume(){
	mixaud.volume = mixvolumeslider.value / 100;
}

function toggleFullScreen(){
	if(vid.requestFullScreen){
		vid.requestFullScreen();
	} else if(vid.webkitRequestFullScreen){
		vid.webkitRequestFullScreen();
	} else if(vid.mozRequestFullScreen){
		vid.mozRequestFullScreen();
	}
}
