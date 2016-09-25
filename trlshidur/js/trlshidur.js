var srv = "v4g.kbb1.com";
var server = null;
if(window.location.protocol === 'http:')
	server = "http://" + srv + ":8088/janus";
else
	server = "https://" + srv + ":8889/janus";

var janus = null;
var mixer = null;
var started = false;
var janusStream;

var myusername = "bb_shidur";
var rmusername = null;
var myid = null;
var mychatid = null;
var mystream = null;
var roomid = null;
var publisher_id = null;
var muted = false;

//var ip = "10.66.23.104";
var ip = "10.66.23.104";
var localport = null;
var remoteport = null;
var aport = 8002;
var vport = 9884;
var room = 1000;

var feeds = [];
var supfeeds = [];
var bitrateTimer = [];
var pluginHandles = [];
var textroom = null;
var participants = {};
var chatrooms = {};
var transactions = {};

var roomlist = {
        1150 : "Hebrew",
        1230 : "Russian",
        1240 : "English",
        1250 : "French",
        1260 : "Spanish",
        1270 : "German",
        1280 : "Italian",
        1420 : "Turkish",
        1410 : "Portuguese",
        1430 : "Bulgarian",
        1440 : "Georgian",
        1450 : "Romanian",
        1460 : "Hungarian",
        1470 : "Swedish",
        1480 : "Lithuanian",
        1490 : "Croatian",
        1500 : "Japanese",
        1510 : "Slovenian",
        1520 : "Polish",
        1530 : "Norvegian",
        1540 : "Latvian",
        1550 : "Ukrainian",
        1560 : "Niderland"
        }

$(document).ready(function() {
	intializePlayer();
	// Initialize the library (console debug enabled)
	Janus.init({ debug: true, callback: initPlugin });
});

function initPlugin() {
	// Create session
	janus = new Janus({
		server: server,
		iceServers: [{url: "stun:v4g.kbb1.com:3478"}],
		success: function() {
			//supportHandle();
			attachHandle(1000);
			autoRefresh();
		},
		error: function(error) {
			console.log(error);
			bootbox.alert(error, function() {
			window.location.reload();
			});
		},
		destroyed: function() {
			initPlugin();
			//window.location.reload();
		}
	});
}

function autoRefresh() {
	setTimeout(function() {
		var req = { "request":"list" };
		mixer.send({"message": req,
			success: function(data) {
				//console.log("--:: Autorefresh messege"+data);
				for(var f in data.list) {
					var room = data.list[f]["room"];
					var roomname = data.list[f]["description"];
					var pnum = data.list[f]["num_participants"];
					$('#'+room+'-pnum').html('('+pnum+')');
				}
			}
		});
                autoRefresh();
        }, 10000);
}

function getRooms() {
	var req = { "request":"list" };
	mixer.send({"message": req,
		success: function(data) {
			for(var f in data.list) {
				var room = data.list[f]["room"];
				var roomname = data.list[f]["description"];
				var pnum = data.list[f]["num_participants"];
				//console.log("--::"+roomid+" : "+roomname+" : "+pnum);
				$('#rooms-list').append('<a id="'+room+'" href="#" class="list-group-item">'+roomname+'<span id="'+room+'-pnum" style="float: right;">('+pnum+')</span></a>');
				$('#'+room).click(function() {
					roomid = Number($(this).attr("id"));
					$('#datarecv').empty();
					$('#rooms-list a').removeClass('active');
                                        $('#'+roomid).addClass('active');
					$('#supusername').addClass('hide').show();
					$('#list').empty();
					chatList(roomid);
					if(myid) {
						var reg = { "request": "changeroom", "room": roomid, "display": "bb_shidur" };
						mixer.send({"message": reg});
						//chatList(roomid);
						/*
						feeds.forEach(function (feed) {
							//console.log("-- :: Remove Feed:"+feed.id);
							if(feed != null && feed != undefined) {
								$('#a'+feed.rfid).remove();
								feed.detach();
							}
						    });
						feeds = [];
						mixer.detach();
						attachHandle(roomid);
						*/
					} else {
						registerUsername(roomid);
						//mixer.hangup();
						//attachHandle();
					}
				});
			}
		}
	});
}

function chatList(roomid) {
	for(var i in chatrooms[roomid]) {
		var role = chatrooms[roomid][i].split("_")[1];
		if(role == "bb") {
			$('#list').append('<li id="rp' + i + '" class="list-group-item">' + chatrooms[roomid][i].split("_")[0] + '</li>');
		}
	}
}

function getListener(id, display) {
        var dparse = display.split("_");
        var displayname = dparse[0];
        var userstatus = dparse[1];
        // Chek who enter to room
        if(userstatus === "bb") {
                console.log("-- ::Enter BB translator");
                $('#list').append('<a id="'+id+'" class="list-group-item list-group-item-info">'+displayname+'</a>');
        } else if(userstatus === "shidur") {
                console.log("-- ::Shidur modrator enter");
        } else {
                console.log("-- ::2nd tranlator enter");
                $('#list').append('<a id="'+id+'" class="list-group-item list-group-item-info">'+displayname+'</a>');
        }
}

function checkregEnter(field, event) {
	var theCode = event.keyCode ? event.keyCode : event.which ? event.which : event.charCode;
	if(theCode == 13) {
		registerUsername();
		return false;
	} else {
		return true;
	}
}

function registerUsername(roomid) {
	$('#rooms-list a').removeClass('active');
	$('#'+roomid).addClass('active');
	var username = "bb_shidur";
	//var register = { "request": "join", "room": roomid, "ptype": "publisher", "display": username};
	var register = { "request": "join", "room": roomid, "display": username };
	myusername = username;
	mixer.send({"message": register});
}

function checkEnter(event) {
        var theCode = event.keyCode ? event.keyCode : event.which ? event.which : event.charCode;
        if(theCode == 13) {
                sendData();
                return false;
        } else {
                return true;
        }
}

