var vid, srcaud, trlaud, mixaud, srcmutebtn, trlmutebtn, mixmutebtn, srcvolumeslider, trlvolumeslider, mixvolumeslider, fullscreenbtn;
function intializePlayer(){
	// Set object references
	vid = document.getElementById("remoteVideo");
	srcaud = document.getElementById("remoteAudio");
	trlaud = document.getElementById("transAudio");
	mixaud = document.getElementById("mixAudio");
	srcmutebtn = document.getElementById("srcmutebtn");
	trlmutebtn = document.getElementById("trlmutebtn");
	mixmutebtn = document.getElementById("mixmutebtn");
	srcvolumeslider = document.getElementById("srcvolumeslider");
	trlvolumeslider = document.getElementById("trlvolumeslider");
	mixvolumeslider = document.getElementById("mixvolumeslider");
	fullscreenbtn = document.getElementById("fullscreenbtn");
	// Add event listeners
	srcmutebtn.addEventListener("click",srcmute,false);
	trlmutebtn.addEventListener("click",trlmute,false);
	mixmutebtn.addEventListener("click",mixmute,false);
	srcvolumeslider.addEventListener("change",srcsetvolume,false);
	trlvolumeslider.addEventListener("change",trlsetvolume,false);
	mixvolumeslider.addEventListener("change",mixsetvolume,false);
	fullscreenbtn.addEventListener("click",toggleFullScreen,false);
	srcaud.muted = true;
	trlaud.muted = true;
	mixaud.muted = true;
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
