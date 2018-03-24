var srv = "v4g.kbb1.com";
var server = null;
if(window.location.protocol === 'http:')
	server = "http://" + srv + "/janustrl";
else
	server = "https://" + srv + "/janustrl";

var janus = null;
var mcutest = null;
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
	1560 : "Niderland",
	1570 : "China"
}

$(document).ready(function() {
	intializePlayer();
	// Initialize the library (console debug enabled)
	Janus.init({ debug: false, callback: initPlugin });
});

function initPlugin() {
	// Create session
	janus = new Janus({
		server: server,
		iceServers: [{urls: "stun:v4g.kbb1.com:3478"}],
		success: function() {
			//supportHandle();
			attachHandle();
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


function attachHandle(roomid) {
	janus.attach({
		plugin: "janus.plugin.videoroom",
		success: function(pluginHandle) {
			mcutest = pluginHandle;
			if(roomid != null) {
				registerUsername(roomid);
			} else {
				$('#rooms-list').empty();
				getRooms();
				attachChat();
			}
		},
		error: function(error) {
			console.log("  -- Error attaching plugin... " + error);
			bootbox.alert("Error attaching plugin... " + error);
		},
		onmessage: function(msg, jsep) {
			console.log(" ::: Got a message (publisher) :::");
			console.log(JSON.stringify(msg));
			var event = msg["videoroom"];
			console.log("Event: " + event);
			if(event != undefined && event != null) {
				if(event === "joined") {
					// Publisher/manager created, negotiate WebRTC and attach to existing feeds, if any
					myid = msg["id"];
					console.log("Successfully joined room " + msg["room"] + " with ID " + myid + " with Name:  " + myusername);
					publishOwnFeed(true);
					// Any new feed to attach to?
					if(msg["publishers"] !== undefined && msg["publishers"] !== null) {
						var list = msg["publishers"];
						console.log("Got a list of available publishers/feeds:");
						console.log(list);
						for(var f in list) {
							var id = list[f]["id"];
							var displayname = list[f]["display"];
							var talk = list[f]["talking"];
							getListener(id, displayname);
							newRemoteFeed(id, displayname, talk)
						}
					}
				} else if(event === "talking") {
					var tid = msg["id"];
					var troom = msg["room"];
					console.log("TRL "+tid+" - start talking");
					for(var i=1; i<9; i++) {
						if(feeds[i] != null && feeds[i] != undefined && feeds[i].rfid == tid) {
							var chatid = feeds[i].rfid;
							$('#'+chatid).css('background-color', '#a9e0b5');
						}
					}
				} else if(event === "stopped-talking") {
					var tid = msg["id"];
					var troom = msg["room"];
					console.log("TRL "+tid+" - stop talking");
					for(var i=1; i<9; i++) {
						if(feeds[i] != null && feeds[i] != undefined && feeds[i].rfid == tid) {
							var chatid = feeds[i].rfid;
							$('#'+chatid).css('background-color', 'white');
						}
					}
				} else if(event === "destroyed") {
					// The room has been destroyed
					console.log("The room has been destroyed!");
					bootbox.alert(error, function() {
						window.location.reload();
					});
				} else if(event === "event") {
					// Any new feed to attach to?
					if(msg["publishers"] !== undefined && msg["publishers"] !== null) {
						var list = msg["publishers"];
						console.log("Got a list of available publishers/feeds:");
						console.log("--== Someone enter :| ==--");
						console.log(list);
						for(var f in list) {
							var id = list[f]["id"];
							var displayname = list[f]["display"];
							getListener(id, displayname);
							newRemoteFeed(id, displayname)
						}
					} else if(msg["leaving"] !== undefined && msg["leaving"] !== null) {
						// One of the publishers has gone away?
						var leaving = msg["leaving"];
						console.log("Publisher left: " + leaving);
						$('#'+leaving).hide();
						$('#a'+leaving).remove();
						var remoteFeed = null;
						for(var i=1; i<6; i++) {
							if(feeds[i] != null && feeds[i] != undefined && feeds[i].rfid == leaving) {
								remoteFeed = feeds[i];
								break;
							}
						}
						if(remoteFeed != null) {
							console.log("Feed " + remoteFeed.rfid + " (" + remoteFeed.rfdisplay + ") has left the room, detaching");
							feeds[remoteFeed.rfindex] = null;
							remoteFeed.detach();
						}
					} else if(msg["unpublished"] !== undefined && msg["unpublished"] !== null) {
						// One of the publishers has unpublished?
						var unpublished = msg["unpublished"];
						console.log("Publisher left: " + unpublished);
						$('#'+unpublished).hide();
						$('#a'+unpublished).remove();
						var remoteFeed = null;
						for(var i=1; i<6; i++) {
							if(feeds[i] != null && feeds[i] != undefined && feeds[i].rfid == unpublished) {
								remoteFeed = feeds[i];
								break;
							}
						}
						if(remoteFeed != null) {
							console.log("Feed " + remoteFeed.rfid + " (" + remoteFeed.rfdisplay + ") has left the room, detaching");
							feeds[remoteFeed.rfindex] = null;
							remoteFeed.detach();
						}
					} else if(msg["error"] !== undefined && msg["error"] !== null) {
						bootbox.alert(msg["error"]);
					}
				}
			}
			if(jsep !== undefined && jsep !== null) {
				console.log("Handling SDP as well...");
				console.log(jsep);
				mcutest.handleRemoteJsep({jsep: jsep});
			}
		},
		onlocalstream: function(stream) {
			console.log(" ::: Got a local stream :::");
			mystream = stream;
			console.log(JSON.stringify(stream));
			$('#videojoin').hide();
			$('#videos').removeClass('hide').show();
		},
		onremotestream: function(stream) {
			// The publisher stream is sendonly, we don't expect anything here
		},
		ondataopen: function(data) {
			Janus.log("The DataChannel is available!");
			$('#videos').removeClass('hide').show();
			$('#datasend').removeAttr('disabled');
			$('#registernow').addClass('hide').show();
		},
		ondata: function(rmusername, data) {
			Janus.debug("We got LOCAL data from: " + rmusername + data);
			$('#datarecv').val(data);
		},
		oncleanup: function() {
			console.log(" ::: Got a cleanup notification: we are unpublished now :::");
			mystream = null;
			muted = false;
			//$('#datasend').attr('disabled', true);
		}
	});
}

function autoRefresh() {
	setTimeout(function() {
		var req = { "request":"list" };
		mcutest.send({"message": req,
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
	mcutest.send({"message": req,
		success: function(data) {
			var rooms = data;
			slist = rooms.list.slice(0);
			slist.sort(function(a,b) {
				var x = a.description.toLowerCase();
				var y = b.description.toLowerCase();
				return x < y ? -1 : x > y ? 1 : 0;
			});
			for(var f in slist) {
				var room = slist[f]["room"];
				var roomname = slist[f]["description"];
				var pnum = slist[f]["num_participants"];
				//console.log("--::"+roomid+" : "+roomname+" : "+pnum);
				$('#rooms-list').append('<a id="'+room+'" href="#" class="list-group-item">'+roomname+'<span id="'+room+'-pnum" style="float: right;">('+pnum+')</span></a>');
				$('#'+room).click(function() {
					$('#datarecv').empty();
					roomid = Number($(this).attr("id"));
					$('#supusername').addClass('hide').show();
					$('#sessions-list').empty();
					for(var i in chatrooms[roomid]) {
						var role = chatrooms[roomid][i].split("_")[1];
						if(role == "bb") {
							//$('#sessions-list').append('<li id="rp' + i + '" class="list-group-item">' + chatrooms[roomid][i].split("_")[0] + '</li>');
						}
					}
					if(myid) {
						feeds.forEach(function (feed) {
							//console.log("-- :: Remove Feed:"+feed.id);
							if(feed != null && feed != undefined) {
								$('#a'+feed.rfid).remove();
								feed.detach();
							}
						});
						feeds = [];
						mcutest.detach();
						attachHandle(roomid);
					} else {
						registerUsername(roomid);
						//mcutest.hangup();
						//attachHandle();
					}
				});
			}
		}
	});
}

function getListener(id, display) {
	var dparse = display.split("_");
	var displayname = dparse[0];
	var userstatus = dparse[1];
	// Chek who enter to room
	if(userstatus === "bb") {
		console.log("-- ::Enter BB translator");
		$('#sessions-list').append('<a id="'+id+'" class="list-group-item list-group-item-info">'+displayname+'</a>');
	} else if(userstatus === "shidur") {
		console.log("-- ::Shidur modrator enter");
	} else {
		console.log("-- ::2nd tranlator enter");
		$('#sessions-list').append('<a id="'+id+'" class="list-group-item list-group-item-info">'+displayname+'</a>');
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
	var register = { "request": "join", "room": roomid, "ptype": "publisher", "display": username};
	myusername = username;
	mcutest.send({"message": register});
}

function publishOwnFeed(useAudio) {
	// Publish our stream
	$('#publish').attr('disabled', true).unbind('click');
	mcutest.createOffer(
		{
			media: { audio: false, video: false, data: true },       // Publishers are sendonly
			success: function(jsep) {
				console.log("Got publisher SDP!");
				console.log(jsep);
				var publish = { "request": "configure", "audio": false, "video": false };
				mcutest.send({"message": publish, "jsep": jsep});
			},
			error: function(error) {
				console.log("WebRTC error:");
				console.log(error);
				if (useAudio) {
					publishOwnFeed(false);
				} else {
					bootbox.alert("WebRTC error... " + JSON.stringify(error));
					$('#publish').removeAttr('disabled').click(function() { publishOwnFeed(true); });
				}
			}
		});
}

function unpublishOwnFeed() {
	var unpublish = { "request": "unpublish" };
	mcutest.send({"message": unpublish});
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

function newRemoteFeed(id, display, talk) {
	// A new feed has been published, create a new plugin handle and attach to it as a listener
	var remoteFeed = null;
	janus.attach(
		{
			plugin: "janus.plugin.videoroom",
			success: function(pluginHandle) {
				remoteFeed = pluginHandle;
				console.log("Plugin attached! (" + remoteFeed.getPlugin() + ", id=" + remoteFeed.getId() + ")");
				console.log("  -- This is a subscriber");
				// We wait for the plugin to send us an offer
				var listen = { "request": "join", "room": roomid, "ptype": "listener", "feed": id };
				remoteFeed.send({"message": listen});
			},
			error: function(error) {
				console.log("  -- Error attaching plugin... " + error);
				bootbox.alert("Error attaching plugin... " + error);
			},
			onmessage: function(msg, jsep) {
				console.log(" ::: Got a message (listener) :::");
				console.log(JSON.stringify(msg));
				var event = msg["videoroom"];
				console.log("Event: " + event);
				if(event != undefined && event != null) {
					if(event === "attached") {
						// Subscriber created and attached
						for(var i=1;i<6;i++) {
							if(feeds[i] === undefined || feeds[i] === null) {
								feeds[i] = remoteFeed;
								remoteFeed.rfindex = i;
								break;
							}
						}
						remoteFeed.rfid = msg["id"];
						remoteFeed.rfdisplay = msg["display"];
						remoteFeed.talk = talk;
						if(talk)
							$('#'+remoteFeed.rfid).css('background-color', '#a9e0b5');
						console.log("Successfully attached to feed " + remoteFeed.rfid + " (" + remoteFeed.rfdisplay + ") in room " + msg["room"]);
						rmusername = remoteFeed.rfdisplay;
					} else if(msg["error"] !== undefined && msg["error"] !== null) {
						bootbox.alert(msg["error"]);
					} else {
						// What has just happened?
					}
				}
				if(jsep !== undefined && jsep !== null) {
					console.log("Handling SDP as well...");
					console.log(jsep);
					// Answer and attach
					remoteFeed.createAnswer(
						{
							jsep: jsep,
							media: { audioSend: false, video: false , data: true},	// We want recvonly audio/video
							success: function(jsep) {
								console.log("Got SDP!");
								console.log(jsep);
								var body = { "request": "start", "room": roomid };
								remoteFeed.send({"message": body, "jsep": jsep});
								trlAudio.volume = trlaud.volume;
								trlAudio.muted = trlaud.muted;
							},
							error: function(error) {
								console.log("WebRTC error:");
								console.log(error);
								bootbox.alert("WebRTC error... " + JSON.stringify(error));
							}
						});

				}
			},
			onlocalstream: function(stream) {
				// The subscriber stream is recvonly, we don't expect anything here
			},
			onremotestream: function(stream) {
				console.log("Remote feed #" + remoteFeed.rfindex);
				// Setup audio elemnt
				trlAudio = document.createElement('audio');
				trlAudio.setAttribute('id', 'a'+remoteFeed.rfid);
				trlAudio.setAttribute('class', 'trldAudio');
				//trlAudio.setAttribute('controls', 'yes');
				trlAudio.setAttribute('autoplay', 'yes');
				document.body.appendChild(trlAudio);
				Janus.attachMediaStream($('#a'+remoteFeed.rfid).get(0), stream);
				$('#trl2panel').removeClass('hide').show();
				$('#datain').removeClass('hide').show();
				$('#dataout').removeClass('hide').show();
			},
			ondataopen: function(data) {
				Janus.log("The DataChannel is available!");
				$('#videos').removeClass('hide').show();
				$('#datasend').removeAttr('disabled');
			},
			ondata: function(data) {
				var dataparse = data.split(":");
				Janus.debug("We got data from: " + data);
				Janus.debug(" -- Split data: " + dataparse[0]);
				if(dataparse[0] === "micst") {
					Janus.debug(" -- Going to select userid: " + dataparse[1]);
					if(dataparse[2] === "Off") {
						Janus.debug(" -- User ID: " + dataparse[1] + " mic is closed!");
						$('#rp'+dataparse[1]).css('background-color', 'white');
					}
					if(dataparse[2] === "On") {
						Janus.debug(" -- User ID: " + dataparse[1] + " mic is open!");
						$('#rp'+dataparse[1]).css('background-color', '#a9e0b5');

					}
				}
				if(dataparse[0] === "support") {
					Janus.debug(" -- Translator: " + dataparse[1] + " from: " + dataparse[2] + " need support!");
				}
			},
			oncleanup: function() {
				console.log(" ::: Got a cleanup notification (remote feed " + id + ") :::");
				//$('#waitingvideo'+remoteFeed.rfindex).remove();
				//$('#datasend').attr('disabled', true);
			}
		});
}

