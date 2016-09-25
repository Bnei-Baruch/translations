var server = null;
var srv = "v4g.kbb1.com";
if(window.location.protocol === 'http:')
	window.location = "https://" + srv + "/trl"; 
else
        server = "https://" + srv + ":8889/janus";

var janus = null;
var textroom = null;
var started = false;
var datalive = null;
var myusername = null;
var mydisplayname = null;
var myid = null;
var mychatid = null;
var rmid = null;
var mystream = null;
var muted = false;

var ip = "10.66.24.122";
//var ip = "10.66.23.104";
var lang;
var device = "default";

var participants = {};
var moderators = {};
var transactions = {};

var lnglist = {
	"Hebrew"	:5150,
	"Russian"	:5230,
	"English"	:5240,
	"French"	:5250,
	"Spanish"	:5260,
	"German"	:5270,
	"Italian"	:5280,
	"Turkish"	:5300,
	"Portuguese"	:5320,
	"Bulgarian"	:5340,
	"Georgian"	:5360,
	"Romanian"	:5380,
	"Hungarian"	:5400,
	"Swedish"	:5420,
	"Lithuanian"	:5440,
	"Croatian"	:5460,
	"Japanese"	:5480,
	"Slovenian"	:5500,
	"Polish"	:5520,
	"Norvegian"	:5540,
	"Latvian"	:5560,
	"Ukrainian"	:5580,
	"Niderland"	:5600
	}

if(localStorage.translate) {
	console.log("  -- Storage Translate: " + localStorage.translate);
	console.log("  -- Storage Video Text: " + localStorage.translatetext);
	var translate = Number(localStorage.translate);
	lang = localStorage.translatetext;
	room = Number("1"+translate+"0");
	mixport = lnglist[lang];
} else {
        var translate = null;
}

$(document).on('click', '#translatelist li a', function () {
	console.log("Selected Option:"+$(this).text());
	translate = Number($(this).attr("id"));
	room = Number("1"+translate+"0");
	localStorage.translate = translate;
	localStorage.translatetext = $(this).text();
	lang = localStorage.translatetext;
	mixport = lnglist[lang];
	console.log("  -- Selected Translate: " + translate);
	$('#translate').removeClass('hide').html("Translate to: " + $(this).text()).show();
	if(translate != undefined && translate != null) {
		$('#start').removeClass('disabled');
	}
});

$(document).on('click', '#deviceslist li a', function () {
        console.log("Selected Option:"+$(this).text());
        device = $(this).attr("id");
        localStorage.device = device;
        localStorage.devicetext = $(this).text();
        devicetext = localStorage.devicetext;
        console.log("  -- Selected Device: " + devicetext);
        $('#devices').removeClass('hide').html("Input: " + $(this).text()).show();
	micLevel();
});

$(document).on('keydown', function(e) {
	  if (e.keyCode === 18) {
		console.log("--:: ALT key pressed!");
	  }
});

$(document).ready(function() {
	intializePlayer();
	initDevices();

	if(localStorage.username) {
		$("#displayname").val(localStorage.username.split("_")[0]);
        }

	$('#displayname').keyup(function(){
		if($(this).val().length > 3) {
		    $('#start').attr('disabled', false);            
		} else {
		    $('#start').attr('disabled',true);
		}
		if(/[^a-zA-Z0-9]/.test($(this))) {
			this.value = this.value.replace(/[^a-zA-Z0-9]/g, '');
		}
	})

	if(translate != undefined && translate != null) {
		$('#translate').removeClass('hide').html("Translate to: " + localStorage.translatetext).show();
	}

	if(device == "default") {
		$('#devices').removeClass('hide').html("Input: Default").show();
	} else {
		$('#devices').removeClass('hide').html("Input: " + localStorage.devicetext).show();
	}

	if(translate != undefined && translate != null) {
		$('#start').removeClass('disabled');
	}

	Janus.init({ debug: true, callback: function() {
		$('#start').click(initPlugins);
		}
	});
});

function initPlugins() {
	if(started)
		return;
	started = true;
	$(this).attr('disabled', true).unbind('click');
	janus = new Janus({
		server: server,
		iceServers: [{url: "stun:itgb.net:3478"}],
		success: function() {
			attachAudio();
			$('#support').click(supportReq);
		},
		error: function(error) {
			console.log(error);
			bootbox.alert(error, function() {
			window.location.reload();
			});
		},
		destroyed: function() {
			window.location.reload();
		}
	});
}

/*
function getListener(id, display) {
	var dparse = display.split("_");
        var displayname = dparse[0];
        var userstatus = dparse[1];
	// Chek who enter to room
	if(userstatus === "bb") {
		console.log("-- ::BB translator in the room");
		$('#sessions-list').append('<a id="'+id+'" class="list-group-item list-group-item-info">'+displayname+'</a>');
	} else if(userstatus === "shidur") {
		console.log("-- ::Shidur modrator in the room");
	} else {
		console.log("-- ::Tranlator in the room");
		$('#sessions-list').append('<a id="'+id+'" class="list-group-item list-group-item-info">'+displayname+'</a>');
	}
}
*/

function registerUsername() {
	var username = $('#displayname').val();
	var username = username + "_trl";
	var register = { "request": "join", "room": room, "display": username };
	myusername = username ;
	localStorage.username = myusername;
	var dparse = myusername.split("_");
	mydisplayname = dparse[0];
	mixer.send({"message": register});
	// Here we going to attach Chat plugin
	attachChat();
}

function initDevices(devices) {
	navigator.mediaDevices.enumerateDevices().then(function(devices) {
		devices.forEach(function(device) {
			var option = $("'<li><a href='#' id='" + device.deviceId + "'>" + device.label + "</a></li>");
			if(device.kind === 'audioinput') {
				$('#deviceslist').append(option);
			} else if(device.kind === 'videoinput') {
				$('#video-device').append(option);
			}
		});
		setDevices();
	});

}

function setDevices() {
	if(localStorage.device) {
		console.log("  -- Storage Device: " + localStorage.device);
		console.log("  -- Storage Device Text: " + localStorage.devicetext);
		device = localStorage.device;
		devicetext = localStorage.devicetext;
		micLevel();
	} else {
		device = "default";
		micLevel();
	}
}

