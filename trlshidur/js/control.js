var trlaud, trlmutebtn, trlvolumeslider;
function intializePlayer(){
        // Set object references
	trlaud = document.getElementById("transAudio");
	trlmutebtn = document.getElementById("trlmutebtn");
	trlvolumeslider = document.getElementById("trlvolumeslider");
        // Add event listeners
	trlmutebtn.addEventListener("click",trlmute,false);
	trlvolumeslider.addEventListener("change",trlsetvolume,false);
	trlaud.muted = true;
}

function trlmute(){
        if(trlaud.muted){
                trlaud.muted = false;
                trlmutebtn.innerHTML = "";
		$('#trlmutebtn').append('<span class="glyphicon glyphicon-volume-up"></span>');
                $('#trlmutebtn').removeClass('btn-warning');
                $('#trlmutebtn').addClass('btn-success');
        } else {
                trlaud.muted = true;
                trlmutebtn.innerHTML = "";
		$('#trlmutebtn').append('<span class="glyphicon glyphicon-volume-off"></span>');
                $('#trlmutebtn').addClass('btn-warning');
                $('#trlmutebtn').removeClass('btn-success');
        }
}

function trlsetvolume(){
        trlaud.volume = trlvolumeslider.value / 100;
}

